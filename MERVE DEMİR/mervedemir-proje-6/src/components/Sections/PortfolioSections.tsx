import { siteConfig } from "@/data/site-config";
import ContactForm from "@/components/ContactForm/ContactForm";
import styles from "./PortfolioSections.module.css";

export default function PortfolioSections() {
  const { about, projects, skills, experience, contact } = siteConfig;

  return (
    <>
      <section className={styles.section} id="hakkimda">
        <div className={styles.container}>
          <p className={styles.eyebrow}>{about.eyebrow}</p>

          <h2 className={styles.title}>{about.title}</h2>

          <p className={styles.description}>{about.description}</p>

          <div className={styles.highlightGrid}>
            {about.highlights.map((item) => (
              <div className={styles.highlightCard} key={item}>
                <span>✦</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="projeler">
        <div className={styles.container}>
          <p className={styles.eyebrow}>Projeler</p>

          <h2 className={styles.title}>
            Yapay zeka ve tasarımı birleştiren çalışmalarım.
          </h2>

          <div className={styles.projectGrid}>
            {projects.map((project, index) => (
              <article
                className={`${styles.projectCard} ${
                  project.featured ? styles.featured : ""
                }`}
                key={project.title}
              >
                <div className={styles.projectNumber}>
                  {String(index + 1).padStart(2, "0")}
                </div>

                <p className={styles.projectCategory}>{project.category}</p>

                <h3>{project.title}</h3>

                <p>{project.description}</p>

                <div className={styles.tags}>
                  {project.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="yetenekler">
        <div className={styles.container}>
          <p className={styles.eyebrow}>Yetenekler</p>

          <h2 className={styles.title}>
            Teknik beceriler ve üretim alanları.
          </h2>

          <div className={styles.skillGrid}>
            {skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="deneyim">
        <div className={styles.container}>
          <p className={styles.eyebrow}>Deneyim</p>

          <h2 className={styles.title}>
            Üretim sürecimde odaklandığım alanlar.
          </h2>

          <div className={styles.experienceGrid}>
            {experience.map((item) => (
              <article className={styles.experienceCard} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.contactSection} id="iletisim">
        <div className={styles.container}>
          <div className={styles.contactBox}>
            <p className={styles.eyebrow}>İletişim</p>

            <h2>{contact.title}</h2>

            <p>{contact.description}</p>

            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}