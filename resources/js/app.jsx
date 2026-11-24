import '../css/app.css';
import './bootstrap';
import './echo';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import GlobalPageLoader from './Components/Skeleton/GlobalPageLoader';

const appName = import.meta.env.VITE_APP_NAME || 'MyBidder.ID';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <GlobalPageLoader />
                <App {...props} />
            </>
        );
    },
    progress: {
        color: '#171717',
        showSpinner: false,
    },
});
