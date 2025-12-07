import { useTranslation } from '../hooks/useTranslation';
import './DocsPage.css';

export function DocsPage() {
  const { t } = useTranslation();
  
  return (
    <div className="docs-page">
      <div className="docs-page-header">
        <h1 className="docs-page-title">
          <span className="docs-page-title-prefix">?</span>
          {t('docs.title')}
        </h1>
        <p className="docs-page-subtitle">{t('docs.subtitle')}</p>
      </div>

      <div className="docs-content">
        <section className="docs-section">
          <h2 className="docs-section-title">
            <span className="docs-section-icon">#</span>
            {t('docs.querySyntax')}
          </h2>
          <div className="docs-section-content">
            <h3 className="docs-subtitle">{t('docs.basicSyntax')}</h3>
            <p className="docs-text">{t('docs.basicSyntaxDesc')}</p>
            <div className="docs-code-block">
              <code>field="value"</code>
            </div>
            <div className="docs-example">
              <div className="docs-example-label">{t('docs.examples')}</div>
              <code>title="admin"</code>
              <code>ip="192.168.1.1"</code>
              <code>port="80"</code>
              <code>domain="example.com"</code>
            </div>

            <h3 className="docs-subtitle">{t('docs.logicalOperators')}</h3>
            <div className="docs-table">
              <div className="docs-table-row">
                <div className="docs-table-cell docs-table-header">{t('docs.operator')}</div>
                <div className="docs-table-cell docs-table-header">{t('docs.description')}</div>
                <div className="docs-table-cell docs-table-header">{t('docs.example')}</div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>&&</code></div>
                <div className="docs-table-cell">{t('docs.operatorAnd')}</div>
                <div className="docs-table-cell"><code>title="login" && body="password"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>||</code></div>
                <div className="docs-table-cell">{t('docs.operatorOr')}</div>
                <div className="docs-table-cell"><code>port="80" || port="443"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>!=</code></div>
                <div className="docs-table-cell">{t('docs.operatorNotEqual')}</div>
                <div className="docs-table-cell"><code>country!="CN"</code></div>
              </div>
            </div>

            <h3 className="docs-subtitle">{t('docs.timeFilters')}</h3>
            <div className="docs-example">
              <div className="docs-example-label">{t('docs.examples')}</div>
              <code>after="2024-01-01"</code>
              <code>before="2024-12-31"</code>
              <code>after="2024-01-01" && before="2024-12-31"</code>
            </div>

            <h3 className="docs-subtitle">{t('docs.advancedQueries')}</h3>
            <div className="docs-example">
              <div className="docs-example-label">{t('docs.iconHash') || 'Icon Hash:'}</div>
              <code>icon_hash="-247388890"</code>
            </div>
            <div className="docs-example">
              <div className="docs-example-label">{t('docs.certificate') || 'Certificate:'}</div>
              <code>cert="google"</code>
            </div>
            <div className="docs-example">
              <div className="docs-example-label">{t('docs.ipRange') || 'IP Range:'}</div>
              <code>ip="192.168.1.1/24"</code>
            </div>
          </div>
        </section>

        <section className="docs-section">
          <h2 className="docs-section-title">
            <span className="docs-section-icon">#</span>
            {t('docs.availableFields')}
          </h2>
          <div className="docs-section-content">
            <div className="docs-table">
              <div className="docs-table-row">
                <div className="docs-table-cell docs-table-header">{t('docs.field')}</div>
                <div className="docs-table-cell docs-table-header">{t('docs.description')}</div>
                <div className="docs-table-cell docs-table-header">{t('docs.example')}</div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>title</code></div>
                <div className="docs-table-cell">{t('docs.fieldTitle')}</div>
                <div className="docs-table-cell"><code>title="admin"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>header</code></div>
                <div className="docs-table-cell">{t('docs.fieldHeader')}</div>
                <div className="docs-table-cell"><code>header="server"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>body</code></div>
                <div className="docs-table-cell">{t('docs.fieldBody')}</div>
                <div className="docs-table-cell"><code>body="password"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>host</code></div>
                <div className="docs-table-cell">{t('docs.fieldHost')}</div>
                <div className="docs-table-cell"><code>host="example.com"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>ip</code></div>
                <div className="docs-table-cell">{t('docs.fieldIp')}</div>
                <div className="docs-table-cell"><code>ip="192.168.1.1"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>port</code></div>
                <div className="docs-table-cell">{t('docs.fieldPort')}</div>
                <div className="docs-table-cell"><code>port="443"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>protocol</code></div>
                <div className="docs-table-cell">{t('docs.fieldProtocol')}</div>
                <div className="docs-table-cell"><code>protocol="https"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>domain</code></div>
                <div className="docs-table-cell">{t('docs.fieldDomain')}</div>
                <div className="docs-table-cell"><code>domain="google.com"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>country</code></div>
                <div className="docs-table-cell">{t('docs.fieldCountry')}</div>
                <div className="docs-table-cell"><code>country="US"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>city</code></div>
                <div className="docs-table-cell">{t('docs.fieldCity')}</div>
                <div className="docs-table-cell"><code>city="Beijing"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>os</code></div>
                <div className="docs-table-cell">{t('docs.fieldOs')}</div>
                <div className="docs-table-cell"><code>os="Linux"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>server</code></div>
                <div className="docs-table-cell">{t('docs.fieldServer')}</div>
                <div className="docs-table-cell"><code>server="nginx"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>app</code></div>
                <div className="docs-table-cell">{t('docs.fieldApp')}</div>
                <div className="docs-table-cell"><code>app="WordPress"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>cert</code></div>
                <div className="docs-table-cell">{t('docs.fieldCert')}</div>
                <div className="docs-table-cell"><code>cert="Let's Encrypt"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>banner</code></div>
                <div className="docs-table-cell">{t('docs.fieldBanner')}</div>
                <div className="docs-table-cell"><code>banner="Apache"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>icon_hash</code></div>
                <div className="docs-table-cell">{t('docs.fieldIconHash')}</div>
                <div className="docs-table-cell"><code>icon_hash="-247388890"</code></div>
              </div>
            </div>
          </div>
        </section>

        <section className="docs-section">
          <h2 className="docs-section-title">
            <span className="docs-section-icon">#</span>
            {t('docs.returnFields')}
          </h2>
          <div className="docs-section-content">
            <p className="docs-text">{t('docs.returnFieldsDesc') || 'Specify which fields to return in the results using comma-separated values:'}</p>
            <div className="docs-code-block">
              <code>host,ip,port,title,domain,server,os</code>
            </div>
            <div className="docs-example">
              <div className="docs-example-label">Common field combinations:</div>
              <code>host,ip,port</code>
              <code>ip,port,title,server</code>
              <code>host,ip,port,title,domain</code>
            </div>
              <p className="docs-text docs-note">
                {t('docs.note')}
              </p>
          </div>
        </section>

        <section className="docs-section">
          <h2 className="docs-section-title">
            <span className="docs-section-icon">#</span>
            {t('docs.queryExamples')}
          </h2>
          <div className="docs-section-content">
            <div className="docs-example-block">
              <div className="docs-example-title">{t('docs.exampleWordPress')}</div>
              <code>app="WordPress"</code>
            </div>
            <div className="docs-example-block">
              <div className="docs-example-title">{t('docs.exampleChinaServers')}</div>
              <code>country="CN" && port="443"</code>
            </div>
            <div className="docs-example-block">
              <div className="docs-example-title">{t('docs.exampleApache')}</div>
              <code>server="Apache" || banner="Apache"</code>
            </div>
            <div className="docs-example-block">
              <div className="docs-example-title">{t('docs.exampleLogin')}</div>
              <code>title="login" || title="signin" || body="password"</code>
            </div>
            <div className="docs-example-block">
              <div className="docs-example-title">{t('docs.exampleIpRange')}</div>
              <code>ip="192.168.1.0/24"</code>
            </div>
            <div className="docs-example-block">
              <div className="docs-example-title">{t('docs.exampleIconHash')}</div>
              <code>icon_hash="-247388890"</code>
            </div>
          </div>
        </section>

        <section className="docs-section">
          <h2 className="docs-section-title">
            <span className="docs-section-icon">#</span>
            {t('docs.queryTypes')}
          </h2>
          <div className="docs-section-content">
            <h3 className="docs-subtitle">{t('docs.searchTitle')}</h3>
            <p className="docs-text">
              {t('docs.searchDesc')}
            </p>
            <div className="docs-example">
              <div className="docs-example-label">{t('docs.searchFeatures')}</div>
              <code>{t('docs.searchFeature1')}</code>
              <code>{t('docs.searchFeature2')}</code>
              <code>{t('docs.searchFeature3')}</code>
              <code>{t('docs.searchFeature4')}</code>
            </div>
            <div className="docs-example-block">
              <div className="docs-example-title">{t('docs.searchUseCase')}</div>
              <code>{t('docs.searchUseCaseExample')}</code>
            </div>

            <h3 className="docs-subtitle">{t('docs.statsTitle')}</h3>
            <p className="docs-text">
              {t('docs.statsDesc')}
            </p>
            <div className="docs-example">
              <div className="docs-example-label">{t('docs.statsFeatures')}</div>
              <code>{t('docs.statsFeature1')}</code>
              <code>{t('docs.statsFeature2')}</code>
              <code>{t('docs.statsFeature3')}</code>
              <code>{t('docs.statsFeature4')}</code>
            </div>
            <div className="docs-example-block">
              <div className="docs-example-title">{t('docs.statsUseCase')}</div>
              <code>{t('docs.statsUseCaseExample')}</code>
            </div>

            <h3 className="docs-subtitle">{t('docs.hostTitle')}</h3>
            <p className="docs-text">
              {t('docs.hostDesc')}
            </p>
            <div className="docs-example">
              <div className="docs-example-label">{t('docs.hostFeatures')}</div>
              <code>{t('docs.hostFeature1')}</code>
              <code>{t('docs.hostFeature2')}</code>
              <code>{t('docs.hostFeature3')}</code>
              <code>{t('docs.hostFeature4')}</code>
            </div>
            <div className="docs-example-block">
              <div className="docs-example-title">{t('docs.hostUseCase')}</div>
              <code>{t('docs.hostUseCaseExample')}</code>
            </div>

            <div className="docs-table">
              <div className="docs-table-row">
                <div className="docs-table-cell docs-table-header">{t('docs.type')}</div>
                <div className="docs-table-cell docs-table-header">{t('docs.apiEndpoint')}</div>
                <div className="docs-table-cell docs-table-header">{t('docs.returnContent')}</div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>SEARCH</code></div>
                <div className="docs-table-cell"><code>/search/all</code></div>
                <div className="docs-table-cell">{t('docs.searchReturnContent') || 'Asset list (supports pagination)'}</div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>STATS</code></div>
                <div className="docs-table-cell"><code>/search/stats</code></div>
                <div className="docs-table-cell">{t('docs.statsReturnContent') || 'Statistical aggregated data'}</div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>HOST</code></div>
                <div className="docs-table-cell"><code>/host</code></div>
                <div className="docs-table-cell">{t('docs.hostReturnContent') || 'All assets of a single host'}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="docs-section">
          <h2 className="docs-section-title">
            <span className="docs-section-icon">#</span>
            {t('docs.apiParameters')}
          </h2>
          <div className="docs-section-content">
            <div className="docs-table">
              <div className="docs-table-row">
                <div className="docs-table-cell docs-table-header">{t('docs.parameter')}</div>
                <div className="docs-table-cell docs-table-header">{t('docs.description')}</div>
                <div className="docs-table-cell docs-table-header">{t('docs.default')}</div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>query</code></div>
                <div className="docs-table-cell">{t('docs.paramQuery')}</div>
                <div className="docs-table-cell">{t('docs.required')}</div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>fields</code></div>
                <div className="docs-table-cell">{t('docs.paramFields')}</div>
                <div className="docs-table-cell"><code>host,ip,port</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>page</code></div>
                <div className="docs-table-cell">{t('docs.paramPage')}</div>
                <div className="docs-table-cell"><code>1</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>size</code></div>
                <div className="docs-table-cell">{t('docs.paramSize')}</div>
                <div className="docs-table-cell"><code>100</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>full</code></div>
                <div className="docs-table-cell">{t('docs.paramFull')}</div>
                <div className="docs-table-cell"><code>false</code></div>
              </div>
            </div>
          </div>
        </section>

        <section className="docs-section">
          <h2 className="docs-section-title">
            <span className="docs-section-icon">#</span>
            {t('docs.moreResources')}
          </h2>
          <div className="docs-section-content">
            <p className="docs-text">{t('docs.forMoreDetails')}</p>
            <div className="docs-link">
              <a href="https://fofa.info/api" target="_blank" rel="noopener noreferrer">
                https://fofa.info/api
              </a>
            </div>
            <div className="docs-link">
              <a href="https://fofa.info/help" target="_blank" rel="noopener noreferrer">
                https://fofa.info/help
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

