import Sidebar from '../components/Sidebar';
import styles from '../Page.module.css';

const EditVideos = () => {
  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.mainContent}>
        <h1>Edit Videos Page</h1>
      </div>
    </div>
  );
}

export default EditVideos;