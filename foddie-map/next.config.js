/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
      return [
        {
          source: '/',
          destination: '/edit_reviewers', 
          permanent: true,
        },
      ];
    },
  };
  
  module.exports = nextConfig;