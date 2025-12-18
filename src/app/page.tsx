import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <>
      {/* NAVBAR */}
      <header className="navbar">
        <div className="navbar-inner">
          <div className="navbar-left">
            <Image
              src="/lnmiit-logo.png"
              alt="LNMIIT Logo"
              width={96}
              height={96}
            />
          </div>

          <nav className="navbar-links">
            <Link href="/">Home</Link>
            <Link href="https://lnmiit.ac.in/isme-2025" target="_blank">
              Official Website
            </Link>
            <Link href="https://lnmiit.ac.in/Transportation" target="_blank">
              Bus Schedule
            </Link>
            <Link href="/map">Campus Map</Link>
            <Link href="http://172.22.2.6/connect/PortalMain">
              Network Portal
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-overlay" />

        <div className="hero-content">
          <Image
            src="/isme-logo.jpg"
            alt="ISME Logo"
            width={110}
            height={110}
            priority
          />

          <h1>
            23<sup>rd</sup> ISME International Conference on
            <br />
            Recent Advances in Mechanical Engineering
          </h1>

          <h2>(ICRAME–2025)</h2>

          <p className="hero-date">December 17 – 19, 2025</p>

          <p className="hero-org">
            Jointly organized by IIT Jodhpur, LNMIIT Jaipur and MNIT Jaipur
          </p>

          <p className="hero-email">📧 isme2025@lnmiit.ac.in</p>
        </div>
      </section>
    </>
  );
}
