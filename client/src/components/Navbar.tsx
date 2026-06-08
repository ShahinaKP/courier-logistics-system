import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav style={styles.nav}>
      <span style={styles.brand}>📦 Courier Collection</span>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>
          Dashboard
        </Link>
        <Link to="/new-package" style={styles.link}>
          New Package
        </Link>
        <Link to="/track" style={styles.link}>
          Track Package
        </Link>
      </div>
    </nav>
  );
};

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    backgroundColor: "#1e293b",
    color: "white",
  },
  brand: { fontWeight: "bold", fontSize: "1.2rem" },
  links: { display: "flex", gap: "1.5rem" },
  link: { color: "white", textDecoration: "none", fontSize: "0.95rem" },
};

export default Navbar;
