"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className={styles.sidebar}>
      <Link href="/edit_videos">
        <div className={`${styles.item} ${pathname === '/edit_videos' ? styles.active : ''}`}>
          <span>Videos to Edit</span>
        </div>
      </Link>
      <Link href="/edit_reviewers">
        <div className={`${styles.item} ${pathname === '/edit_reviewers' ? styles.active : ''}`}>
          <span>Reviewers</span>
        </div>
      </Link>
      <Link href="/edit_restaurants">
        <div className={`${styles.item} ${pathname === '/edit_restaurants' ? styles.active : ''}`}>
          <span>Restaurants</span>
        </div>
      </Link>
    </div>
  );
};

export default Sidebar;