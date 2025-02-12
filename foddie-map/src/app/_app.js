import '../styles/globals.css';
import Sidebar from '../components/Sidebar';

function MyApp({ Component, pageProps }) {
  return (
    <div className="container">
      <Sidebar />
      <div className="main-content">
        <Component {...pageProps} />
      </div>
    </div>
  );
}

export default MyApp;