import { copy } from "../../data/copy";
import { Wordmark } from "./Wordmark";
import "./Footer.css";

export function Footer() {
  return (
    // Волны дрейфуют фоном самого footer, поэтому носитель атрибута — он сам.
    <footer className="site-footer" data-anim="wave">
      {/* Гало вынесено из ::before в отдельный узел: статичное правило блока
          reduced motion возвращает смещение по горизонтали именно ему, а на
          footer оно сдвинуло бы всю секцию. */}
      <div className="site-footer__halo" data-anim="halo" aria-hidden="true" />
      {/* Одна колонка по центру: ширину, отступы и центровку задаёт Footer.css. */}
      <div className="site-footer__inner">
        <Wordmark size="footer" />
        <p className="site-footer__caption">{copy.footer.caption}</p>

        <nav className="site-footer__links" aria-label={copy.footer.linksLabel}>
          <ul>
            {copy.footer.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label} <span className="sr-only">{copy.footer.newTabHint}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="site-footer__legal">{copy.footer.legal}</p>
      </div>
    </footer>
  );
}
