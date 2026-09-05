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
import { GlassCard } from "../layout/GlassCard";
import { GradientTitle } from "../layout/GradientTitle";
import { Section } from "../layout/Section";
import { ConsentCheckbox } from "./ConsentCheckbox";
import { FormField } from "./FormField";
import { LightTypeChoice } from "./LightTypeChoice";
import { SuccessToast } from "./SuccessToast";

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
    setValues(next);

    if (!attempted) {
      return;
    }

    // Набор текста только гасит ошибку поля, новых не зажигает.
    const fresh = validateLightForm(next);
    setErrors((prev) => (prev[field] && !fresh[field] ? withoutField(prev, field) : prev));
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

    setSubmitting(true);
    submitTimer.current = setTimeout(() => {
      submitTimer.current = null;
      addLight({ type: toLightType(values.type), countryId: Number(values.countryId) });
      setValues((prev) => ({ ...initialLightFormValues, type: prev.type }));
      setErrors({});
      setAttempted(false);
      setSubmitting(false);
      setToastOpen(true);
      setToastKey((prev) => prev + 1);
      returnFocus.current = true;
    }, SUBMIT_DELAY);
  }

  const closeToast = useCallback(() => setToastOpen(false), []);

  return (
    <Section id="light-form" className="lf-section">
      <div className="lf-head">
        <Eyebrow>{formCopy.eyebrow}</Eyebrow>
        <GradientTitle as="h2" variant="section">
          {formCopy.title}
        </GradientTitle>
        <p className="lf-lead">{formCopy.lead}</p>
      </div>

      <GlassCard className="lf-card">
        <form className="lf-form" ref={formRef} noValidate onSubmit={handleSubmit}>
          {/* Пока идёт отправка, поля заблокированы: иначе набор за эти 1200 мс стёрся бы сбросом. */}
          <fieldset className="lf-fields" disabled={submitting}>
            <LightTypeChoice
              value={values.type}
              onChange={(type) => setValues((prev) => ({ ...prev, type }))}
            />

            <div className="lf-grid">
              <FormField
                id={fieldId("firstName")}
                label={formCopy.fields.firstName.label}
                error={errors.firstName}
              >
                {(control) => (
                  <input
                    {...control}
                    type="text"
                    name="firstName"
                    autoComplete="given-name"
                    placeholder={formCopy.fields.firstName.placeholder}
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
              >
                {(control) => (
                  <input
                    {...control}
                    type="text"
                    name="lastName"
                    autoComplete="family-name"
                    placeholder={formCopy.fields.lastName.placeholder}
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

              <FormField id={fieldId("city")} label={formCopy.fields.city.label} error={errors.city}>
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

          <Button
            as="button"
            type="submit"
            variant="primary"
            id={submitId}
            className="lf-submit"
            disabled={submitting}
            aria-busy={submitting || undefined}
          >
            {submitting ? formCopy.submitting : formCopy.submit}
          </Button>
        </form>
      </GlassCard>

      {/*
        Живой регион смонтирован всегда и пустой до успеха: скринридер объявляет отправку
        сменой текста внутри уже существующего региона. Тост ниже — только визуальная копия.
      */}
      <p className="sr-only" role="status" aria-live="polite">
        {toastOpen ? formCopy.success : ""}
      </p>

      <SuccessToast
        key={toastKey}
        open={toastOpen}
        message={formCopy.success}
        onClose={closeToast}
      />
    </Section>
  );
}
