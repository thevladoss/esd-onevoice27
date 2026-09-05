import { copy } from "../../data/copy";
import { Wordmark } from "./Wordmark";
import "./Footer.css";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner mx-auto max-w-[72rem] px-4 md:px-8">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <Wordmark />
            <p className="site-footer__caption">{copy.footer.caption}</p>
          </div>

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
        </div>

        <div className="site-footer__legal">
          <p>{copy.footer.legal}</p>
        </div>
      </div>
    </footer>
  );
}
