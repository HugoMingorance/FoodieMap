import Sidebar from '../components/Sidebar';
import styles from '../page.module.css';

const EditRestaurants = () => {
  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.mainContent}>
        <h1>Edit Restaurants Page</h1>
      </div>
    </div>
  );
}

export default EditRestaurants;