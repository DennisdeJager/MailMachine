"use client";

import {
  Activity,
  CheckCircle2,
  Copy,
  KeyRound,
  Mail,
  Play,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Tags,
  Trash2
} from "lucide-react";
import { FormEvent, type ReactNode, useMemo, useState } from "react";
import type { Category, Credential, Mailbox, Rule } from "@/domain/types";
import type { DashboardData } from "@/domain/repository";

type ApiState = { type: "idle" | "loading" | "success" | "error"; message: string };
type SetupTab = "overview" | "permissions" | "run" | "save" | "verify";
type SetupGuide = {
  redirectUri: string;
  consentUrl: string;
  checklist: string[];
  manifestPatch: object;
  bootstrap: {
    recommendedMode: string;
    requiredAdminRoles: string[];
    requiredScopes: string[];
    permissions: string[];
    securityWarnings: string[];
    instructions: string[];
    postRunChecks: string[];
    powershellScript: string;
  };
};

function postJson(path: string, body: object) {
  return fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  }).then(async (response) => {
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error ?? "De actie kon niet worden uitgevoerd.");
    }
    return payload.data;
  });
}

function deleteJson(path: string, body: object) {
  return fetch(path, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  }).then(async (response) => {
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error ?? "Verwijderen is mislukt.");
    }
    return payload.data;
  });
}

function formData(event: FormEvent<HTMLFormElement>) {
  const data = new FormData(event.currentTarget);
  return Object.fromEntries(data.entries());
}

function StatusBanner({ state }: { state: ApiState }) {
  if (state.type === "idle") return null;
  const className = state.type === "error" ? "badge danger" : state.type === "success" ? "badge success" : "badge warning";
  return <span className={className}>{state.message}</span>;
}

export function AdminApp({ initialData }: { initialData: DashboardData }) {
  const [credentials, setCredentials] = useState(initialData.credentials);
  const [mailboxes, setMailboxes] = useState(initialData.mailboxes);
  const [categories, setCategories] = useState(initialData.categories);
  const [rules, setRules] = useState(initialData.rules);
  const [state, setState] = useState<ApiState>({ type: "idle", message: "" });
  const [setup, setSetup] = useState<null | SetupGuide>(null);
  const [setupTab, setSetupTab] = useState<SetupTab>("overview");
  const [monitorResult, setMonitorResult] = useState<string>("");

  const activeRules = useMemo(() => rules.filter((rule) => rule.isActive).length, [rules]);
  const activeMailboxes = useMemo(() => mailboxes.filter((mailbox) => mailbox.monitorEnabled).length, [mailboxes]);

  async function submit<T>(message: string, action: () => Promise<T>) {
    setState({ type: "loading", message: "Bezig met opslaan..." });
    try {
      const result = await action();
      setState({ type: "success", message });
      return result;
    } catch (error) {
      setState({ type: "error", message: error instanceof Error ? error.message : "De actie is mislukt." });
      return null;
    }
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <ShieldCheck size={28} />
          Outlook Classifier
        </div>
        <nav className="nav" aria-label="Hoofdnavigatie">
          <a href="#dashboard"><Activity size={18} /> Dashboard</a>
          <a href="#mailboxes"><Mail size={18} /> Mailboxen</a>
          <a href="#rules"><Tags size={18} /> Regels</a>
          <a href="#credentials"><KeyRound size={18} /> Credentials</a>
          <a href="#setup"><Settings size={18} /> Microsoft setup</a>
        </nav>
      </aside>

      <main className="main">
        <div className="topbar" id="dashboard">
          <div>
            <h1>Mailbox classificatiebeheer</h1>
            <div className="muted">Monitor Outlook-mailboxen via Microsoft Graph en label berichten automatisch met Outlook-categorieen.</div>
          </div>
          <StatusBanner state={state} />
        </div>

        {!initialData.dbReady ? (
          <section className="panel span-12">
            <h2>Database configuratie nodig</h2>
            <p className="muted">{initialData.dbError}</p>
            <p>Voer de SQL-migratie uit in PostgreSQL en configureer <strong>DATABASE_URL</strong> en <strong>CREDENTIAL_ENCRYPTION_KEY</strong>. De app bewaart beheerdata niet in bestanden of browseropslag.</p>
          </section>
        ) : null}

        <section className="grid">
          <div className="panel span-3">
            <h3>Mailboxen</h3>
            <div className="stat">{activeMailboxes}</div>
            <div className="muted">Actieve monitors</div>
          </div>
          <div className="panel span-3">
            <h3>Regels</h3>
            <div className="stat">{activeRules}</div>
            <div className="muted">Actieve classificaties</div>
          </div>
          <div className="panel span-3">
            <h3>Categorieen</h3>
            <div className="stat">{categories.length}</div>
            <div className="muted">Outlook labels</div>
          </div>
          <div className="panel span-3">
            <h3>Credentials</h3>
            <div className="stat">{credentials.length}</div>
            <div className="muted">Entra appconfiguraties</div>
          </div>

          <div className="panel span-12">
            <div className="toolbar">
              <div>
                <h2>Handmatige monitor-run</h2>
                <div className="muted">Verwerkt maximaal 25 recente berichten per actieve mailbox.</div>
              </div>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  const result = await submit("Monitor-run afgerond.", () => postJson("/api/v1/monitor/run", {}));
                  if (result) setMonitorResult(JSON.stringify(result, null, 2));
                }}
              >
                <Play size={18} /> Run monitor
              </button>
            </div>
            {monitorResult ? <pre>{monitorResult}</pre> : <div className="muted">Nog geen run-resultaat in deze sessie.</div>}
          </div>

          <section className="panel span-7" id="mailboxes">
            <div className="toolbar">
              <h2>Mailboxen</h2>
              <span className="badge">{mailboxes.length} gekoppeld</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Naam</th><th>E-mailadres</th><th>Credential</th><th>Status</th><th>Acties</th></tr>
                </thead>
                <tbody>
                  {mailboxes.length === 0 ? (
                    <tr><td colSpan={5}>Nog geen mailboxen. Voeg een mailbox toe om monitoring te starten.</td></tr>
                  ) : mailboxes.map((mailbox) => (
                    <tr key={mailbox.id}>
                      <td>{mailbox.name}</td>
                      <td>{mailbox.emailAddress}</td>
                      <td>{mailbox.credentialName}</td>
                      <td><span className={mailbox.status === "active" ? "badge success" : "badge warning"}>{mailbox.status}</span></td>
                      <td>
                        <button className="btn btn-danger icon-btn" aria-label={`Verwijder ${mailbox.name}`} onClick={async () => {
                          const ok = await submit("Mailbox verwijderd.", () => deleteJson("/api/v1/mailboxes", { id: mailbox.id, name: mailbox.name }));
                          if (ok) setMailboxes((items) => items.filter((item) => item.id !== mailbox.id));
                        }}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel span-5">
            <h2>Mailbox toevoegen</h2>
            <form className="form-grid" onSubmit={async (event) => {
              event.preventDefault();
              const data = formData(event);
              const created = await submit("Mailbox toegevoegd.", () => postJson("/api/v1/mailboxes", data));
              if (created) setMailboxes((items) => [created as Mailbox, ...items]);
            }}>
              <Field name="name" label="Naam *" placeholder="Finance mailbox" />
              <Field name="emailAddress" label="E-mailadres *" placeholder="finance@bedrijf.nl" />
              <label className="field full">Credential *
                <select name="credentialId" required>
                  <option value="">Kies credential</option>
                  {credentials.map((credential) => <option key={credential.id} value={credential.id}>{credential.name}</option>)}
                </select>
              </label>
              <Field name="folder" label="Map *" defaultValue="Inbox" />
              <Field name="pollingMinutes" label="Interval minuten *" defaultValue="5" />
              <button className="btn btn-primary" type="submit"><Plus size={18} /> Toevoegen</button>
            </form>
          </section>

          <section className="panel span-6" id="rules">
            <h2>Classificatieregels</h2>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Prioriteit</th><th>Naam</th><th>Conditie</th><th>Categorie</th><th>Acties</th></tr></thead>
                <tbody>
                  {rules.length === 0 ? (
                    <tr><td colSpan={5}>Nog geen regels. Maak een regel aan met minimaal een conditie.</td></tr>
                  ) : rules.map((rule) => (
                    <tr key={rule.id}>
                      <td>{rule.priority}</td>
                      <td>{rule.name}</td>
                      <td>{[rule.senderContains && `afzender: ${rule.senderContains}`, rule.subjectContains && `onderwerp: ${rule.subjectContains}`, rule.bodyContains && `tekst: ${rule.bodyContains}`].filter(Boolean).join(", ")}</td>
                      <td><span className="badge">{rule.categoryName}</span></td>
                      <td><button className="btn btn-danger icon-btn" aria-label={`Verwijder ${rule.name}`} onClick={async () => {
                        const ok = await submit("Regel verwijderd.", () => deleteJson("/api/v1/rules", { id: rule.id, name: rule.name }));
                        if (ok) setRules((items) => items.filter((item) => item.id !== rule.id));
                      }}><Trash2 size={18} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel span-6">
            <h2>Regel toevoegen</h2>
            <form className="form-grid" onSubmit={async (event) => {
              event.preventDefault();
              const created = await submit("Regel toegevoegd.", () => postJson("/api/v1/rules", formData(event)));
              if (created) setRules((items) => [...items, created as Rule].sort((a, b) => a.priority - b.priority));
            }}>
              <Field name="name" label="Naam *" />
              <Field name="priority" label="Prioriteit *" defaultValue="100" />
              <label className="field">Match
                <select name="matchMode"><option value="all">Alle condities</option><option value="any">Een conditie</option></select>
              </label>
              <label className="field">Bijlagen
                <select name="hasAttachments"><option value="any">Maakt niet uit</option><option value="true">Heeft bijlagen</option><option value="false">Geen bijlagen</option></select>
              </label>
              <Field name="senderContains" label="Afzender bevat" />
              <Field name="subjectContains" label="Onderwerp bevat" />
              <label className="field full">Categorie *
                <select name="categoryId" required>
                  <option value="">Kies categorie</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="field full">Berichttekst bevat
                <textarea name="bodyContains" />
              </label>
              <label className="field"><span>Stop na match</span><select name="stopProcessing"><option value="false">Nee</option><option value="true">Ja</option></select></label>
              <button className="btn btn-primary" type="submit"><Plus size={18} /> Toevoegen</button>
            </form>
          </section>

          <section className="panel span-6">
            <h2>Outlook categorieen</h2>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Naam</th><th>Kleur</th><th>Omschrijving</th><th>Acties</th></tr></thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr><td colSpan={4}>Nog geen categorieen. Voeg de labels toe die ook in Outlook bestaan of aangemaakt worden.</td></tr>
                  ) : categories.map((category) => (
                    <tr key={category.id}>
                      <td>{category.name}</td><td>{category.color}</td><td>{category.description}</td>
                      <td><button className="btn btn-danger icon-btn" aria-label={`Verwijder ${category.name}`} onClick={async () => {
                        const ok = await submit("Categorie verwijderd.", () => deleteJson("/api/v1/categories", { id: category.id, name: category.name }));
                        if (ok) setCategories((items) => items.filter((item) => item.id !== category.id));
                      }}><Trash2 size={18} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel span-6">
            <h2>Categorie toevoegen</h2>
            <form className="form-grid" onSubmit={async (event) => {
              event.preventDefault();
              const created = await submit("Categorie toegevoegd.", () => postJson("/api/v1/categories", formData(event)));
              if (created) setCategories((items) => [...items, created as Category]);
            }}>
              <Field name="name" label="Naam *" placeholder="Factuur" />
              <Field name="color" label="Outlook kleur *" defaultValue="preset0" />
              <label className="field full">Omschrijving<textarea name="description" /></label>
              <button className="btn btn-primary" type="submit"><Plus size={18} /> Toevoegen</button>
            </form>
          </section>

          <section className="panel span-12" id="credentials">
            <h2>Secure credential vault</h2>
            <form className="form-grid" onSubmit={async (event) => {
              event.preventDefault();
              const created = await submit("Credential versleuteld opgeslagen.", () => postJson("/api/v1/credentials", formData(event)));
              if (created) setCredentials((items) => [created as Credential, ...items.filter((item) => item.name !== (created as Credential).name)]);
            }}>
              <Field name="name" label="Herkenbare naam *" placeholder="Productie tenant" />
              <Field name="tenantId" label="Tenant ID *" />
              <Field name="clientId" label="Client ID *" />
              <Field name="clientSecret" label="Client secret *" type="password" />
              <Field name="graphBaseUrl" label="Graph URL *" defaultValue="https://graph.microsoft.com/v1.0" />
              <Field name="authorityHost" label="Authority host *" defaultValue="https://login.microsoftonline.com" />
              <button className="btn btn-primary" type="submit"><KeyRound size={18} /> Versleuteld opslaan</button>
            </form>
          </section>

          <section className="panel span-12 setup-panel" id="setup">
            <div className="toolbar">
              <div>
                <h2>Microsoft/OAuth setup automation</h2>
                <div className="muted">Begeleide flow voor een veilige Entra app registration, Graph consent en credential-opslag.</div>
              </div>
              <button className="btn btn-secondary" onClick={async () => {
                const result = await submit("Setup gegenereerd.", () => postJson("/api/v1/setup", {
                  tenantId: credentials[0]?.tenantId,
                  clientId: credentials[0]?.clientId,
                  appName: "Outlook Classifier Admin",
                  redirectUri: `${window.location.origin}/api/v1/setup/callback`
                }));
                if (result) {
                  setSetup(result as SetupGuide);
                  setSetupTab("overview");
                }
              }}><RefreshCw size={18} /> Genereer setup</button>
            </div>
            {setup ? (
              <div className="setup-workflow">
                <div className="setup-summary">
                  <div>
                    <strong>Aanbevolen route</strong>
                    <p>{setup.bootstrap.recommendedMode}</p>
                  </div>
                  <div>
                    <strong>Tenant</strong>
                    <p>{credentials[0]?.tenantId || "Nog niet ingevuld; script gebruikt placeholder."}</p>
                  </div>
                  <div>
                    <strong>Resultaat</strong>
                    <p>App registration, service principal, client secret en Graph application permissions.</p>
                  </div>
                </div>

                <div className="tabs" role="tablist" aria-label="Microsoft setup stappen">
                  <SetupTabButton active={setupTab === "overview"} onClick={() => setSetupTab("overview")}>1. Overzicht</SetupTabButton>
                  <SetupTabButton active={setupTab === "permissions"} onClick={() => setSetupTab("permissions")}>2. Rechten</SetupTabButton>
                  <SetupTabButton active={setupTab === "run"} onClick={() => setSetupTab("run")}>3. Uitvoeren</SetupTabButton>
                  <SetupTabButton active={setupTab === "save"} onClick={() => setSetupTab("save")}>4. Opslaan</SetupTabButton>
                  <SetupTabButton active={setupTab === "verify"} onClick={() => setSetupTab("verify")}>5. Controleren</SetupTabButton>
                </div>

                {setupTab === "overview" ? (
                  <div className="tab-panel">
                    <div className="flow-grid">
                      <SetupInfo title="Wat maakt dit aan">
                        <p>Het script maakt een Microsoft Entra app registration en service principal voor MailMachine. Daarna krijgt die app tenant-brede Graph application permissions, zodat mailboxen server-side gemonitord kunnen worden.</p>
                      </SetupInfo>
                      <SetupInfo title="Wat doet de app niet automatisch">
                        <p>MailMachine voert het script niet zelf uit en schrijft geen secrets naar Git. Een beheerder reviewt en draait het script bewust in PowerShell.</p>
                      </SetupInfo>
                      <SetupInfo title="Redirect URI">
                        <code>{setup.redirectUri}</code>
                      </SetupInfo>
                      <SetupInfo title="Admin consent URL">
                        <a href={setup.consentUrl} target="_blank" rel="noreferrer">{setup.consentUrl}</a>
                      </SetupInfo>
                    </div>
                  </div>
                ) : null}

                {setupTab === "permissions" ? (
                  <div className="tab-panel">
                    <div className="flow-grid">
                      <SetupInfo title="Benodigde Entra-rollen">
                        {setup.bootstrap.requiredAdminRoles.map((item) => <p key={item}><ShieldCheck size={16} /> {item}</p>)}
                      </SetupInfo>
                      <SetupInfo title="Bootstrap-login scopes">
                        <div className="badge-row">{setup.bootstrap.requiredScopes.map((scope) => <span className="badge warning" key={scope}>{scope}</span>)}</div>
                      </SetupInfo>
                      <SetupInfo title="MailMachine application permissions">
                        <div className="badge-row">{setup.bootstrap.permissions.map((permission) => <span className="badge" key={permission}>{permission}</span>)}</div>
                      </SetupInfo>
                      <SetupInfo title="Security aandachtspunten">
                        {setup.bootstrap.securityWarnings.map((item) => <p key={item}><ShieldCheck size={16} /> {item}</p>)}
                      </SetupInfo>
                    </div>
                  </div>
                ) : null}

                {setupTab === "run" ? (
                  <div className="tab-panel">
                    <SetupInfo title="Uitvoerstappen">
                      <ol>{setup.bootstrap.instructions.map((item) => <li key={item}>{item}</li>)}</ol>
                    </SetupInfo>
                    <div className="step script-step">
                      <div className="toolbar">
                        <strong>PowerShell bootstrap-script</strong>
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={async () => {
                            await navigator.clipboard.writeText(setup.bootstrap.powershellScript);
                            setState({ type: "success", message: "Script naar klembord gekopieerd." });
                          }}
                        >
                          <Copy size={18} /> Kopieer script
                        </button>
                      </div>
                      <pre>{setup.bootstrap.powershellScript}</pre>
                    </div>
                  </div>
                ) : null}

                {setupTab === "save" ? (
                  <div className="tab-panel">
                    <div className="flow-grid">
                      <SetupInfo title="Na uitvoeren direct bewaren">
                        <p>Kopieer Tenant ID, Client ID en Client secret uit de PowerShell-output naar de credential vault. Microsoft toont de client secret maar een keer.</p>
                      </SetupInfo>
                      <SetupInfo title="Credential vault">
                        <p>De vault versleutelt de client secret server-side met <code>CREDENTIAL_ENCRYPTION_KEY</code> en bewaart alleen encrypted data in PostgreSQL.</p>
                      </SetupInfo>
                      <SetupInfo title="Daarna mailbox koppelen">
                        <p>Maak een mailbox aan met deze credential en gebruik alleen mailboxen waarvoor monitoring operationeel is toegestaan.</p>
                      </SetupInfo>
                      <SetupInfo title="Checklist">
                        {setup.checklist.map((item) => <p key={item}><CheckCircle2 size={16} /> {item}</p>)}
                      </SetupInfo>
                    </div>
                  </div>
                ) : null}

                {setupTab === "verify" ? (
                  <div className="tab-panel">
                    <div className="flow-grid">
                      <SetupInfo title="Controle na uitvoeren">
                        {setup.bootstrap.postRunChecks.map((item) => <p key={item}><CheckCircle2 size={16} /> {item}</p>)}
                      </SetupInfo>
                      <SetupInfo title="Manifest patch">
                        <pre>{JSON.stringify(setup.manifestPatch, null, 2)}</pre>
                      </SetupInfo>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : <div className="muted">Klik op genereren om de tenant-specifieke setupinformatie te maken.</div>}
          </section>

          <section className="panel span-12">
            <h2>Auditlog</h2>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Tijd</th><th>Actor</th><th>Actie</th><th>Entiteit</th><th>Naam</th></tr></thead>
                <tbody>
                  {initialData.audits.length === 0 ? (
                    <tr><td colSpan={5}>Nog geen auditregels.</td></tr>
                  ) : initialData.audits.map((event) => (
                    <tr key={event.id}><td>{new Date(event.createdAt).toLocaleString("nl-NL")}</td><td>{event.actor}</td><td>{event.action}</td><td>{event.entityType}</td><td>{event.entityName}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <div className="version">Versie 2026-05-26 21:23:00</div>
      </main>
    </div>
  );
}

function Field({ name, label, type = "text", placeholder, defaultValue }: { name: string; label: string; type?: string; placeholder?: string; defaultValue?: string }) {
  return (
    <label className="field">
      {label}
      <input name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} required={label.includes("*")} />
    </label>
  );
}

function SetupTabButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button className={active ? "tab active" : "tab"} type="button" role="tab" aria-selected={active} onClick={onClick}>
      {children}
    </button>
  );
}

function SetupInfo({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="step">
      <strong>{title}</strong>
      {children}
    </div>
  );
}
