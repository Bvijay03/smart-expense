import { Wallet, Users, Receipt, Shield, ArrowRight, Download, Smartphone } from 'lucide-react';
import './index.css';

function App() {
  return (
    <>
      {/* Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="brand">
            <Wallet className="brand-icon" size={28} />
            <span>Smart Expense</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
              Features
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="animate-fade-in">
              <h1 className="hero-title">
                The smart way to <span className="gradient-text-primary">track & split</span> expenses.
              </h1>
            </div>
            <div className="animate-fade-in delay-100">
              <p className="hero-subtitle">
                Whether you're managing personal budgets or splitting bills with friends, Smart Expense handles the math so you don't have to.
              </p>
            </div>
            <div className="hero-actions animate-fade-in delay-200">
              <a href="#download" className="btn btn-primary">
                <Download size={20} />
                Download APK
              </a>
              <a href="#features" className="btn btn-outline">
                See How It Works
                <ArrowRight size={20} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Everything you need</h2>
            <p className="section-subtitle">Powerful features designed to take the stress out of finances.</p>
          </div>
          
          <div className="features-grid">
            <div className="glass-panel">
              <div className="feature-icon-wrapper">
                <Users size={24} />
              </div>
              <h3 className="feature-title">Group Splitting</h3>
              <p className="feature-text">
                Create groups for trips, roommates, or events. Add expenses and let our engine calculate exactly who owes what.
              </p>
            </div>

            <div className="glass-panel">
              <div className="feature-icon-wrapper">
                <Receipt size={24} />
              </div>
              <h3 className="feature-title">Smart Settlements</h3>
              <p className="feature-text">
                Our algorithm minimizes the number of transactions needed to settle up. Get paid back faster with zero confusion.
              </p>
            </div>

            <div className="glass-panel">
              <div className="feature-icon-wrapper">
                <Wallet size={24} />
              </div>
              <h3 className="feature-title">Personal Budgets</h3>
              <p className="feature-text">
                Keep an eye on your personal spending alongside your group expenses. Set monthly budgets and get alerts.
              </p>
            </div>

            <div className="glass-panel">
              <div className="feature-icon-wrapper">
                <Shield size={24} />
              </div>
              <h3 className="feature-title">Secure & Private</h3>
              <p className="feature-text">
                Your data is securely stored and encrypted. We focus on utility and privacy, never selling your financial data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="download-section">
        <div className="container">
          <div className="glass-panel download-card">
            <div className="feature-icon-wrapper" style={{ margin: '0 auto 1.5rem auto' }}>
              <Smartphone size={32} />
            </div>
            <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>Get Smart Expense</h2>
            <p className="section-subtitle" style={{ marginBottom: '2rem' }}>Download the latest Android version directly.</p>
            
            <div className="version-badge">Version 1.0.0 (Latest)</div>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <a href="/smart-expense-latest.apk" download className="btn btn-primary" style={{ padding: '1rem 2rem' }}>
                <Download size={20} />
                Download APK for Android
              </a>
            </div>

            <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>How to install:</strong>
              <ol style={{ paddingLeft: '1.2rem', margin: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>Download the APK file to your device.</li>
                <li style={{ marginBottom: '0.5rem' }}>Open the downloaded file. If prompted, go to Settings and enable "Install from Unknown Sources".</li>
                <li>Follow the on-screen instructions to install.</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Wallet className="brand-icon" size={20} />
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Smart Expense</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Smart Expense. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

export default App;
