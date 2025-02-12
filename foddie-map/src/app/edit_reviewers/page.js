import Sidebar from '../components/Sidebar.js';
import styles from '../page.module.css';

const EditReviewers = () => {
  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.mainContent}>
        <h1>Edit Reviewers Page</h1>
      </div>
    </div>
  );
}

export default EditReviewers;