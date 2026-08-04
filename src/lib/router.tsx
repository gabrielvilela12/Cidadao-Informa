import React, {
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

type LocationLike = {
  pathname: string;
  search: string;
  hash: string;
  state?: unknown;
  key: string;
};

type NavigateFn = (to: string | number, options?: NavigateOptions) => void;

type RouterContextValue = {
  location: LocationLike;
  navigate: NavigateFn;
};

type Params = Record<string, string>;

const RouterContext = createContext<RouterContextValue | null>(null);
const ParamsContext = createContext<Params>({});
const NAVIGATION_EVENT = 'cidadao-router:navigate';

function currentLocation(): LocationLike {
  return {
    pathname: window.location.pathname || '/',
    search: window.location.search || '',
    hash: window.location.hash || '',
    state: window.history.state,
    key: `${window.location.pathname}${window.location.search}${window.location.hash}`,
  };
}

function normalizePath(path: string): string {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

function splitPath(path: string): string[] {
  return normalizePath(path).replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
}

function navigateTo(to: string, options: NavigateOptions = {}) {
  const url = normalizePath(to);
  if (options.replace) {
    window.history.replaceState(options.state ?? null, '', url);
  } else {
    window.history.pushState(options.state ?? null, '', url);
  }
  window.dispatchEvent(new Event(NAVIGATION_EVENT));
}

function useRouterContext(): RouterContextValue {
  const context = useContext(RouterContext);
  if (!context) throw new Error('Router hooks must be used inside BrowserRouter.');
  return context;
}

export function BrowserRouter({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationLike>(() => currentLocation());

  useEffect(() => {
    const sync = () => setLocation(currentLocation());
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    window.addEventListener(NAVIGATION_EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
      window.removeEventListener(NAVIGATION_EVENT, sync);
    };
  }, []);

  const navigate = useCallback<NavigateFn>((to, options) => {
    if (typeof to === 'number') {
      window.history.go(to);
      return;
    }
    navigateTo(to, options);
  }, []);

  const value = useMemo(() => ({ location, navigate }), [location, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useNavigate(): NavigateFn {
  return useRouterContext().navigate;
}

export function useLocation(): LocationLike {
  return useRouterContext().location;
}

export function useParams<T extends Params = Params>(): Partial<T> {
  return useContext(ParamsContext) as Partial<T>;
}

type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string;
  replace?: boolean;
  state?: unknown;
};

export function Link({ to, replace, state, onClick, ...props }: LinkProps) {
  const navigate = useNavigate();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.altKey
      || event.ctrlKey
      || event.shiftKey
      || props.target
    ) {
      return;
    }

    event.preventDefault();
    navigate(to, { replace, state });
  };

  return <a {...props} href={to} onClick={handleClick} />;
}

type NavLinkRenderProps = {
  isActive: boolean;
  isPending: boolean;
};

type NavLinkProps = Omit<LinkProps, 'className'> & {
  end?: boolean;
  className?: string | ((props: NavLinkRenderProps) => string | undefined);
};

export function NavLink({ to, end, className, ...props }: NavLinkProps) {
  const { pathname } = useLocation();
  const target = normalizePath(to);
  const active = end ? pathname === target : pathname === target || pathname.startsWith(`${target}/`);
  const resolvedClassName = typeof className === 'function'
    ? className({ isActive: active, isPending: false })
    : className;

  return <Link {...props} to={to} className={resolvedClassName} aria-current={active ? 'page' : undefined} />;
}

type RouteProps = {
  path: string;
  element: React.ReactElement;
};

export function Route(_props: RouteProps) {
  return null;
}

function matchRoute(routePath: string, pathname: string): Params | null {
  if (routePath === '*') return {};

  const routeSegments = splitPath(routePath);
  const pathSegments = splitPath(pathname);
  if (routeSegments.length !== pathSegments.length) return null;

  const params: Params = {};
  for (let index = 0; index < routeSegments.length; index += 1) {
    const routeSegment = routeSegments[index];
    const pathSegment = pathSegments[index];
    if (routeSegment.startsWith(':')) {
      params[routeSegment.slice(1)] = decodeURIComponent(pathSegment);
    } else if (routeSegment !== pathSegment) {
      return null;
    }
  }

  return params;
}

type RoutesProps = {
  children: React.ReactNode;
  location?: Partial<LocationLike>;
};

export function Routes({ children, location }: RoutesProps) {
  const router = useRouterContext();
  const activeLocation = {
    ...router.location,
    ...location,
  };
  let fallback: React.ReactElement<RouteProps> | null = null;

  for (const child of React.Children.toArray(children)) {
    if (!isValidElement<RouteProps>(child)) continue;
    if (child.props.path === '*') {
      fallback = child;
      continue;
    }

    const params = matchRoute(child.props.path, activeLocation.pathname);
    if (params) {
      return <ParamsContext.Provider value={params}>{child.props.element}</ParamsContext.Provider>;
    }
  }

  if (fallback) {
    return <ParamsContext.Provider value={{}}>{fallback.props.element}</ParamsContext.Provider>;
  }

  return null;
}

type NavigateProps = {
  to: string;
  replace?: boolean;
  state?: unknown;
};

export function Navigate({ to, replace, state }: NavigateProps) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace, state });
  }, [navigate, replace, state, to]);

  return null;
}