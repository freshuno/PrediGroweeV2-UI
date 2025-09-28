import { useRouter } from 'next/router';

const useRouterPush = async (url: string) => {
  const router = useRouter();
  try {
    return await router.push(url);
  } catch (error) {
    console.error(error);
    throw error;
  }
};
export default useRouterPush;
