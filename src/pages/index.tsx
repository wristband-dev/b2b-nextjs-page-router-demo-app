import { apiClient as axios } from '@/client/browser-axios-client';
import { useAuth } from '@/context/auth-context';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  const sayHello = async () => {
    try {
      const res = await axios.get('/api/v1/hello', { baseURL: window.location.origin });
      alert(res.data.message);
    } catch (error: unknown) {
      console.log(error);
    }
  };

  return (
    <section>
      <div style={{ margin: '0 auto' }}>
        <h1 className="text-3xl font-bold underline">Home</h1>
      </div>

      <div style={{ margin: '2rem auto' }}>
        {!isAuthenticated && <h3>Loading...</h3>}
        {isAuthenticated && (
          <button
            id="say-hello-button"
            type="button"
            tabIndex={0}
            onClick={sayHello}
            style={{
              cursor: 'pointer',
              width: '8rem',
              backgroundColor: '#00ffc1',
              color: '#0c0c0c',
              borderRadius: '0.375rem',
              border: '1px solid #00ffc1',
              padding: '0.5rem 0.75rem',
              fontWeight: '600',
              fontSize: '1rem',
            }}
          >
            Say Hello
          </button>
        )}
      </div>
    </section>
  );
}
