interface ExportPanelProps {
  interviewId: string
  updatedAt: string
  onExport: () => void
}

export function ExportPanel({ interviewId, updatedAt, onExport }: ExportPanelProps) {
  return (
    <section className="export" aria-labelledby="vienti-otsikko">
      <h2 id="vienti-otsikko">Perhehistorian vienti</h2>
      <p>
        Tallennus tapahtuu tällä laitteella (<code>localStorage</code> + ääniviitteet). Vie
        jäsennelty JSON sukutarinaa varten.
      </p>
      <p className="export__meta">
        Istunto <code>{interviewId}</code>
        <br />
        Päivitetty {updatedAt}
      </p>
      <button type="button" className="btn btn--save" onClick={onExport}>
        Lataa perhehistoria-JSON
      </button>
    </section>
  )
}
