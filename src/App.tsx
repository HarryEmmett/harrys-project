import './App.css'

function App() {
  return (
    <>
      <section id="spacer"></section>
      <section id="page-content">
        <div className="hero">
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
      </section>

      <section id="likes-container">
        <div id="likes">
          <h2>likes</h2>
          <p>Your questions, answered</p>
        </div>
        <div id="viewers">
          <h2>Viewers</h2>
          <p>Join the Vite community</p>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
