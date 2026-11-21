export type SplashNavigation = {
    state: "idle" | "loading" | "submitting";
    formMethod?: string | undefined;
    location?: {
        pathname: string;
    } | undefined;
};
export declare function normalPath(pathname: string): string;
export declare function shouldShowRouteSplash(navigation: SplashNavigation, isSplashPath: (pathname: string) => boolean): boolean;
