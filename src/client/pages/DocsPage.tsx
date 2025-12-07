import './DocsPage.css';

export function DocsPage() {
  return (
    <div className="docs-page">
      <div className="docs-page-header">
        <h1 className="docs-page-title">
          <span className="docs-page-title-prefix">?</span>
          DOCUMENTATION
        </h1>
        <p className="docs-page-subtitle">FOFA API query syntax and field reference</p>
      </div>

      <div className="docs-content">
        <section className="docs-section">
          <h2 className="docs-section-title">
            <span className="docs-section-icon">#</span>
            QUERY SYNTAX
          </h2>
          <div className="docs-section-content">
            <h3 className="docs-subtitle">Basic Syntax</h3>
            <p className="docs-text">FOFA uses a simple query syntax to search for assets:</p>
            <div className="docs-code-block">
              <code>field="value"</code>
            </div>
            <div className="docs-example">
              <div className="docs-example-label">Examples:</div>
              <code>title="admin"</code>
              <code>ip="192.168.1.1"</code>
              <code>port="80"</code>
              <code>domain="example.com"</code>
            </div>

            <h3 className="docs-subtitle">Logical Operators</h3>
            <div className="docs-table">
              <div className="docs-table-row">
                <div className="docs-table-cell docs-table-header">Operator</div>
                <div className="docs-table-cell docs-table-header">Description</div>
                <div className="docs-table-cell docs-table-header">Example</div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>&&</code></div>
                <div className="docs-table-cell">AND (both conditions must match)</div>
                <div className="docs-table-cell"><code>title="login" && body="password"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>||</code></div>
                <div className="docs-table-cell">OR (either condition can match)</div>
                <div className="docs-table-cell"><code>port="80" || port="443"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>!=</code></div>
                <div className="docs-table-cell">NOT EQUAL</div>
                <div className="docs-table-cell"><code>country!="CN"</code></div>
              </div>
            </div>

            <h3 className="docs-subtitle">Time Filters</h3>
            <div className="docs-example">
              <div className="docs-example-label">Examples:</div>
              <code>after="2024-01-01"</code>
              <code>before="2024-12-31"</code>
              <code>after="2024-01-01" && before="2024-12-31"</code>
            </div>

            <h3 className="docs-subtitle">Advanced Queries</h3>
            <div className="docs-example">
              <div className="docs-example-label">Icon Hash:</div>
              <code>icon_hash="-247388890"</code>
            </div>
            <div className="docs-example">
              <div className="docs-example-label">Certificate:</div>
              <code>cert="google"</code>
            </div>
            <div className="docs-example">
              <div className="docs-example-label">IP Range:</div>
              <code>ip="192.168.1.1/24"</code>
            </div>
          </div>
        </section>

        <section className="docs-section">
          <h2 className="docs-section-title">
            <span className="docs-section-icon">#</span>
            AVAILABLE FIELDS
          </h2>
          <div className="docs-section-content">
            <div className="docs-table">
              <div className="docs-table-row">
                <div className="docs-table-cell docs-table-header">Field</div>
                <div className="docs-table-cell docs-table-header">Description</div>
                <div className="docs-table-cell docs-table-header">Example</div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>title</code></div>
                <div className="docs-table-cell">Page title</div>
                <div className="docs-table-cell"><code>title="admin"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>header</code></div>
                <div className="docs-table-cell">HTTP header</div>
                <div className="docs-table-cell"><code>header="server"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>body</code></div>
                <div className="docs-table-cell">Page body content</div>
                <div className="docs-table-cell"><code>body="password"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>host</code></div>
                <div className="docs-table-cell">Hostname or domain</div>
                <div className="docs-table-cell"><code>host="example.com"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>ip</code></div>
                <div className="docs-table-cell">IP address</div>
                <div className="docs-table-cell"><code>ip="192.168.1.1"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>port</code></div>
                <div className="docs-table-cell">Port number</div>
                <div className="docs-table-cell"><code>port="443"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>protocol</code></div>
                <div className="docs-table-cell">Protocol type</div>
                <div className="docs-table-cell"><code>protocol="https"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>domain</code></div>
                <div className="docs-table-cell">Domain name</div>
                <div className="docs-table-cell"><code>domain="google.com"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>country</code></div>
                <div className="docs-table-cell">Country code</div>
                <div className="docs-table-cell"><code>country="US"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>city</code></div>
                <div className="docs-table-cell">City name</div>
                <div className="docs-table-cell"><code>city="Beijing"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>os</code></div>
                <div className="docs-table-cell">Operating system</div>
                <div className="docs-table-cell"><code>os="Linux"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>server</code></div>
                <div className="docs-table-cell">Server software</div>
                <div className="docs-table-cell"><code>server="nginx"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>app</code></div>
                <div className="docs-table-cell">Application name</div>
                <div className="docs-table-cell"><code>app="WordPress"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>cert</code></div>
                <div className="docs-table-cell">SSL certificate</div>
                <div className="docs-table-cell"><code>cert="Let's Encrypt"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>banner</code></div>
                <div className="docs-table-cell">Service banner</div>
                <div className="docs-table-cell"><code>banner="Apache"</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>icon_hash</code></div>
                <div className="docs-table-cell">Website icon hash</div>
                <div className="docs-table-cell"><code>icon_hash="-247388890"</code></div>
              </div>
            </div>
          </div>
        </section>

        <section className="docs-section">
          <h2 className="docs-section-title">
            <span className="docs-section-icon">#</span>
            RETURN FIELDS
          </h2>
          <div className="docs-section-content">
            <p className="docs-text">Specify which fields to return in the results using comma-separated values:</p>
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
              Note: Available return fields may vary. Check FOFA official documentation for the complete list.
            </p>
          </div>
        </section>

        <section className="docs-section">
          <h2 className="docs-section-title">
            <span className="docs-section-icon">#</span>
            QUERY EXAMPLES
          </h2>
          <div className="docs-section-content">
            <div className="docs-example-block">
              <div className="docs-example-title">Find WordPress sites:</div>
              <code>app="WordPress"</code>
            </div>
            <div className="docs-example-block">
              <div className="docs-example-title">Find servers in China:</div>
              <code>country="CN" && port="443"</code>
            </div>
            <div className="docs-example-block">
              <div className="docs-example-title">Find Apache servers:</div>
              <code>server="Apache" || banner="Apache"</code>
            </div>
            <div className="docs-example-block">
              <div className="docs-example-title">Find login pages:</div>
              <code>title="login" || title="signin" || body="password"</code>
            </div>
            <div className="docs-example-block">
              <div className="docs-example-title">Find specific IP range:</div>
              <code>ip="192.168.1.0/24"</code>
            </div>
            <div className="docs-example-block">
              <div className="docs-example-title">Find sites with specific icon:</div>
              <code>icon_hash="-247388890"</code>
            </div>
          </div>
        </section>

        <section className="docs-section">
          <h2 className="docs-section-title">
            <span className="docs-section-icon">#</span>
            API PARAMETERS
          </h2>
          <div className="docs-section-content">
            <div className="docs-table">
              <div className="docs-table-row">
                <div className="docs-table-cell docs-table-header">Parameter</div>
                <div className="docs-table-cell docs-table-header">Description</div>
                <div className="docs-table-cell docs-table-header">Default</div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>query</code></div>
                <div className="docs-table-cell">FOFA query syntax</div>
                <div className="docs-table-cell">Required</div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>fields</code></div>
                <div className="docs-table-cell">Return fields (comma-separated)</div>
                <div className="docs-table-cell"><code>host,ip,port</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>page</code></div>
                <div className="docs-table-cell">Page number</div>
                <div className="docs-table-cell"><code>1</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>size</code></div>
                <div className="docs-table-cell">Results per page (max 10000)</div>
                <div className="docs-table-cell"><code>100</code></div>
              </div>
              <div className="docs-table-row">
                <div className="docs-table-cell"><code>full</code></div>
                <div className="docs-table-cell">Search all results (not just last year)</div>
                <div className="docs-table-cell"><code>false</code></div>
              </div>
            </div>
          </div>
        </section>

        <section className="docs-section">
          <h2 className="docs-section-title">
            <span className="docs-section-icon">#</span>
            MORE RESOURCES
          </h2>
          <div className="docs-section-content">
            <p className="docs-text">For more detailed documentation, visit:</p>
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

