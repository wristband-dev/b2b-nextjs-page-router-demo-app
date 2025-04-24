import { FaExclamationTriangle } from 'react-icons/fa';

import { isUnauthorizedError } from '@/utils/helpers';
import frontendApiService from '@/services/frontend-api-service';
import { redirectToLogin, useWristbandAuth } from '@wristband/react-client-auth';

export default function HomePage() {
  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  const { isAuthenticated, isLoading } = useWristbandAuth();

  const sayHello = async () => {
    try {
      const data = await frontendApiService.sayHello();
      alert(data.message);
    } catch (error: unknown) {
      console.log(error);

      /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
      if (isUnauthorizedError(error)) {
        redirectToLogin('/api/auth/login', { returnUrl: encodeURI(window.location.href) });
        return;
      }

      alert(error);
    }
  };

  return (
    <section>
      <div className="my-0 mx-auto">
        <h1 className="text-3xl font-bold underline">Home</h1>
      </div>

      <div className="p-4 my-4">
        <div className="flex items-center bg-yellow bg-opacity-60 rounded-lg p-4 shadow-md w-full max-w-[600px] mx-auto font-medium">
          <FaExclamationTriangle className="text-2xl mr-4 min-w-[32px]" color="black" />
          <p className="text-lg text-left">We aim to add more functionality to this demo soon.</p>
        </div>
      </div>

      <div className="my-8 mx-auto">
        {isLoading && <h3>Loading...</h3>}
        {isAuthenticated && (
          <>
            <h2 className="mb-4 font-bold">Client-side API Route Call</h2>
            <button
              id="say-hello-button"
              type="button"
              tabIndex={0}
              onClick={sayHello}
              className="shadow-md cursor-pointer bg-[#00ffc1] hover:brightness-90 text-[#0c0c0c] rounded py-2 px-8 font-semibold text-lg transition ease-in-out duration-200"
            >
              Say Hello
            </button>
          </>
        )}
      </div>
    </section>
  );
}
