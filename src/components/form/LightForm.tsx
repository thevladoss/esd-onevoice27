import "./light-form.css";
import type { FormEvent } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { formCopy } from "../../data/copy.form";
import { ESD_COUNTRIES } from "../../data/countries";
import type { LightFormErrors, LightFormField, LightFormValues } from "../../lib/validation";
import {
  LIGHT_FORM_FIELD_ORDER,
  initialLightFormValues,
  toLightType,
  validateLightForm,
} from "../../lib/validation";
import { useLights } from "../../state/lights";
import { Button } from "../layout/Button";
import { Eyebrow } from "../layout/Eyebrow";
import { GradientTitle } from "../layout/GradientTitle";
import { Reveal } from "../layout/Reveal";
import { Section } from "../layout/Section";
import { ConsentCheckbox } from "./ConsentCheckbox";
import { FormField } from "./FormField";
import { LightTypeChoice } from "./LightTypeChoice";
import { SuccessLiveRegion, SuccessToast } from "./SuccessToast";

const SUBMIT_DELAY = 1200;

function withoutField(errors: LightFormErrors, field: LightFormField): LightFormErrors {
  const next = { ...errors };
  delete next[field];
  return next;
}

export function LightForm() {
  // Префикс на экземпляр: два блока формы на странице не делят id и не воруют друг у друга фокус.
  const uid = useId();
  const fieldId = (field: LightFormField) => `${uid}-${field}`;
  const submitId = `${uid}-submit`;

  const { addLight } = useLights();
  const [values, setValues] = useState<LightFormValues>(initialLightFormValues);
  const [errors, setErrors] = useState<LightFormErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  // Отказ формы: страна не дошла до карты, подтверждать нечего.
  const [failed, setFailed] = useState(false);
  // Каждый успех монтирует тост заново: таймер автозакрытия отсчитывается от последнего огонька.
  const [toastKey, setToastKey] = useState(0);
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const returnFocus = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  /** Контрол ищется внутри своей формы, а не по всему документу. */
  function focusInForm(id: string) {
    formRef.current?.querySelector<HTMLElement>(`[id="${id}"]`)?.focus();
  }

  useEffect(
    () => () => {
      if (submitTimer.current !== null) {
        clearTimeout(submitTimer.current);
      }
    },
    [],
  );

  // Кнопка получает фокус после отправки, но только если пользователь не занял его сам.
  useEffect(() => {
    if (submitting || !returnFocus.current) {
      return;
    }

    returnFocus.current = false;
    const active = document.activeElement;
    if (active === null || active === document.body) {
      formRef.current?.querySelector<HTMLElement>(`[id="${submitId}"]`)?.focus();
    }
  }, [submitting, submitId]);

  function updateField(field: LightFormField, value: string | boolean) {
    const next = { ...values, [field]: value } as LightFormValues;

    // Переход на личный свет стирает организацию: её поля больше нет в разметке,
    // и старое значение не должно вернуться вместе с повторным выбором группы.
    if (field === "type" && value !== "group") {
      next.orgName = "";
    }

    setValues(next);
    setFailed(false);

    if (!attempted) {
      return;
    }

    // Набор текста только гасит ошибку поля, новых не зажигает.
    const fresh = validateLightForm(next);
    setErrors((prev) => {
      let updated = prev;

      if (updated[field] && !fresh[field]) {
        updated = withoutField(updated, field);
      }

      // Смена типа уносит и ошибку организации: требование ушло вместе с полем.
      if (field === "type" && updated.orgName && !fresh.orgName) {
        updated = withoutField(updated, "orgName");
      }

      return updated;
    });
  }

  function revalidateField(field: LightFormField) {
    if (!attempted) {
      return;
    }

    const fresh = validateLightForm(values);
    const message = fresh[field];
    setErrors((prev) => (message ? { ...prev, [field]: message } : withoutField(prev, field)));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const found = validateLightForm(values);
    setErrors(found);
    setAttempted(true);

    const firstInvalid = LIGHT_FORM_FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      focusInForm(fieldId(firstInvalid));
      return;
    }

    // Пустой тип уже отсечён валидацией: проверка нужна только компилятору.
    const lightType = values.type;
    if (lightType === "") {
      return;
    }

    setSubmitting(true);
    setFailed(false);
    submitTimer.current = setTimeout(() => {
      submitTimer.current = null;
      const lit = addLight({ type: toLightType(lightType), countryId: Number(values.countryId) });
      setSubmitting(false);
      returnFocus.current = true;

      // Огонёк не зажёгся: форма не чистится, чтобы посетителю было что поправить,
      // и подтверждения тоже нет — тост объявил бы несуществующий успех.
      if (!lit) {
        setFailed(true);
        setErrors({ countryId: formCopy.errors.countryId });
        return;
      }

      setValues((prev) => ({ ...initialLightFormValues, type: prev.type }));
      setErrors({});
      setAttempted(false);
      setToastOpen(true);
      setToastKey((prev) => prev + 1);
    }, SUBMIT_DELAY);
  }

  const closeToast = useCallback(() => setToastOpen(false), []);

  return (
    <Section id="light-form" titleId="form-title" className="lf-section">
      <Reveal className="lf-head">
        <Eyebrow>{formCopy.eyebrow}</Eyebrow>
        <GradientTitle as="h2" variant="section" id="form-title">
          {formCopy.title}
        </GradientTitle>
        <p className="lf-lead">{formCopy.lead}</p>
      </Reveal>

      <Reveal delay={0.1}>
        <form className="lf-form" ref={formRef} noValidate onSubmit={handleSubmit}>
          {/* Пока идёт отправка, поля заблокированы: иначе набор за эти 1200 мс стёрся бы сбросом. */}
          <fieldset className="lf-fields" disabled={submitting}>
            <LightTypeChoice
              id={fieldId("type")}
              value={values.type}
              error={errors.type}
              onChange={(next) => updateField("type", next)}
            />

            <div className="lf-grid">
              {/* Организацию спрашивает только групповой маяк. Поле не прячется, а
                  исчезает из разметки: скрытое поле путало бы фокус и aria. */}
              {values.type === "group" ? (
                <FormField
                  id={fieldId("orgName")}
                  label={formCopy.fields.orgName.label}
                  error={errors.orgName}
                  className="lf-span"
                  required
                >
                  {(control) => (
                    <input
                      {...control}
                      type="text"
                      name="orgName"
                      autoComplete="organization"
                      placeholder={formCopy.fields.orgName.placeholder}
                      value={values.orgName}
                      onChange={(event) => updateField("orgName", event.target.value)}
                      onBlur={() => revalidateField("orgName")}
                    />
                  )}
                </FormField>
              ) : null}

              <FormField
                id={fieldId("firstName")}
                label={formCopy.fields.firstName.label}
                error={errors.firstName}
                className="lf-col-3"
                required
              >
                {(control) => (
                  <input
                    {...control}
                    type="text"
                    name="firstName"
                    autoComplete="given-name"
                    value={values.firstName}
                    onChange={(event) => updateField("firstName", event.target.value)}
                    onBlur={() => revalidateField("firstName")}
                  />
                )}
              </FormField>

              <FormField
                id={fieldId("lastName")}
                label={formCopy.fields.lastName.label}
                error={errors.lastName}
                className="lf-col-3"
                required
              >
                {(control) => (
                  <input
                    {...control}
                    type="text"
                    name="lastName"
                    autoComplete="family-name"
                    value={values.lastName}
                    onChange={(event) => updateField("lastName", event.target.value)}
                    onBlur={() => revalidateField("lastName")}
                  />
                )}
              </FormField>

              <FormField
                id={fieldId("countryId")}
                label={formCopy.fields.country.label}
                error={errors.countryId}
                className="lf-col-3"
                required
              >
                {(control) => (
                  <select
                    {...control}
                    name="countryId"
                    autoComplete="country-name"
                    value={values.countryId}
                    onChange={(event) => updateField("countryId", event.target.value)}
                    onBlur={() => revalidateField("countryId")}
                  >
                    <option value="">{formCopy.fields.country.placeholder}</option>
                    {ESD_COUNTRIES.map((country) => (
                      <option key={country.id} value={String(country.id)}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>

              <FormField
                id={fieldId("city")}
                label={formCopy.fields.city.label}
                error={errors.city}
                className="lf-col-3"
              >
                {(control) => (
                  <input
                    {...control}
                    type="text"
                    name="city"
                    autoComplete="address-level2"
                    placeholder={formCopy.fields.city.placeholder}
                    value={values.city}
                    onChange={(event) => updateField("city", event.target.value)}
                    onBlur={() => revalidateField("city")}
                  />
                )}
              </FormField>

              <FormField
                id={fieldId("email")}
                label={formCopy.fields.email.label}
                error={errors.email}
                className="lf-span"
                required
              >
                {(control) => (
                  <input
                    {...control}
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder={formCopy.fields.email.placeholder}
                    value={values.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    onBlur={() => revalidateField("email")}
                  />
                )}
              </FormField>
            </div>

            <ConsentCheckbox
              id={fieldId("consent")}
              checked={values.consent}
              error={errors.consent}
              onChange={(next) => updateField("consent", next)}
              onBlur={() => revalidateField("consent")}
            />
          </fieldset>

          {failed ? (
            <p className="lf-error lf-submit-error" role="alert">
              {formCopy.failure}
            </p>
          ) : null}

          <Button
            as="button"
            type="submit"
            variant="primary"
            size="form"
            id={submitId}
            className="lf-submit"
            disabled={submitting}
            aria-busy={submitting || undefined}
          >
            {submitting ? formCopy.submitting : formCopy.submit}
          </Button>
        </form>
      </Reveal>

      {/* Тост ниже — визуальная копия: объявляет успех живой регион, а не карточка. */}
      <SuccessLiveRegion message={toastOpen ? formCopy.success : ""} />

      <SuccessToast
        key={toastKey}
        open={toastOpen}
        message={formCopy.success}
        onClose={closeToast}
      />
    </Section>
  );
}
