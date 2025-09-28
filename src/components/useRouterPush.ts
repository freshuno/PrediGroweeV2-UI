import { useRouter } from 'next/router';

const useRouterPush = (path: string) => {
  const { push } = useRouter();
  return push(path);
};
export default useRouterPush;
