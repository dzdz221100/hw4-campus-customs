import yaleY from "../assets/yale-y.png";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <img src={yaleY} className="footer-mark" alt="Yale" />
      <p>Campus Customs &mdash; officially licensed Yale gear, made for the whole Bulldog family.</p>
    </footer>
  );
}
