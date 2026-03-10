  // src/hooks/useNavigationHistory.ts
  import { useEffect } from "react";
  import { useHistory, useLocation } from "react-router-dom";

  export const NAV_STACK_KEY = "nav:stack";

  function getStack(): string[] {
    try {
      const raw = sessionStorage.getItem(NAV_STACK_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function setStack(stack: string[]) {
    try {
      sessionStorage.setItem(NAV_STACK_KEY, JSON.stringify(stack));
    } catch {
      // ignore storage errors
    }
  }

  /**
   * Mount this once (globally) so we always track route changes.
   */
  export function NavigationTracker() {
    const location = useLocation();

    useEffect(() => {
      const stack = getStack();
      const last = stack[stack.length - 1];
      // only push if route actually changed
      if (last !== location.pathname) {
        stack.push(location.pathname);
        setStack(stack);
      }
    }, [location.pathname]);
    return null;
  }

  /**
   * Hook: gives helpers to work with the stack
   */
  export default function useNavigationHistory() {
    const history = useHistory();

    const getLast = (fallback = "/") => {
      const stack = getStack();
      return stack.length > 1
        ? stack[stack.length - 2] // last visited before current
        : fallback;
    };

    //here i have added state, to pass the data from one page to another
    const pushLatest = (path: string, state?: any) => {
      const stack = getStack();
      // avoid duplicate consecutive pushes
      if (stack[stack.length - 1] !== path) {
        stack.push(path);
        setStack(stack);
      }
      history.push(path, state);
    };

    const goBack = (fallback = "/") => {
      if (window.history.length > 1) {
        history.goBack();
      } else {
        history.push(fallback);
      }
    };


    return { getLast, pushLatest, goBack };
  }
