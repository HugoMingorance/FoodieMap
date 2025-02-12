"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className={styles.sidebar}>
      <ul>
        <li className={pathname === '/edit_videos' ? styles.active : ''}>
          <Link href="/edit_videos">Videos to Edit</Link>
        </li>
        <li className={pathname === '/edit_reviewers' ? styles.active : ''}>
          <Link href="/edit_reviewers">Reviewers</Link>
        </li>
        <li className={pathname === '/edit_restaurants' ? styles.active : ''}>
          <Link href="/edit_restaurants">Restaurants</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;