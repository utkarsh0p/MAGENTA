"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { LogOut } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(CustomEase);
}

interface CurrentUser {
  id?: string;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
}

export function KineticNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const hasOpenedRef = useRef(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isActiveRoute = (href: string) => pathname === href;
  const profileName = currentUser?.full_name || currentUser?.name || currentUser?.email || "Profile";

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!response.ok) {
          if (isMounted) setCurrentUser(null);
          if (response.status === 401) {
            router.replace("/login");
          }
          return;
        }

        const payload = (await response.json().catch(() => null)) as
          | { user?: CurrentUser }
          | null;

        if (isMounted) {
          setCurrentUser(payload?.user ?? null);
        }
      } catch {
        if (isMounted) setCurrentUser(null);
      }
    };

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setCurrentUser(null);
      setIsMenuOpen(false);
      setIsLoggingOut(false);
      router.push("/login");
      router.refresh();
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      if (!gsap.parseEase("main")) {
        CustomEase.create("main", "0.65, 0.01, 0.05, 0.99");
        gsap.defaults({ ease: "main", duration: 0.7 });
      }
    } catch (error) {
      console.warn("CustomEase failed to load, falling back to default.", error);
      gsap.defaults({ ease: "power2.out", duration: 0.7 });
    }

    const ctx = gsap.context(() => {
      const arrowLine = document.querySelector(".arrow-line");

      if (arrowLine) {
        const pathLength = (arrowLine as SVGPathElement).getTotalLength();

        gsap.set(arrowLine, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
        });

        const arrowTl = gsap.timeline({ repeat: -1, repeatDelay: 0.8 });
        arrowTl
          .to(arrowLine, {
            strokeDashoffset: 0,
            duration: 1,
            ease: "power2.out",
          })
          .to({}, { duration: 1.2 })
          .to(arrowLine, {
            strokeDashoffset: -pathLength,
            duration: 0.6,
            ease: "power2.in",
          })
          .set(arrowLine, { strokeDashoffset: pathLength });
      }

      const menuItems = containerRef.current!.querySelectorAll(
        ".menu-list-item[data-shape]",
      );
      const shapesContainer = containerRef.current!.querySelector(
        ".ambient-background-shapes",
      );

      menuItems.forEach((item) => {
        const shapeIndex = item.getAttribute("data-shape");
        const shape = shapesContainer
          ? shapesContainer.querySelector(`.bg-shape-${shapeIndex}`)
          : null;

        if (!shape) return;

        const shapeEls = shape.querySelectorAll(".shape-element");

        const onEnter = () => {
          if (shapesContainer) {
            shapesContainer
              .querySelectorAll(".bg-shape")
              .forEach((s) => s.classList.remove("active"));
          }

          shape.classList.add("active");

          gsap.fromTo(
            shapeEls,
            { scale: 0.5, opacity: 0, rotation: -10 },
            {
              scale: 1,
              opacity: 1,
              rotation: 0,
              duration: 0.6,
              stagger: 0.08,
              ease: "back.out(1.7)",
              overwrite: "auto",
            },
          );
        };

        const onLeave = () => {
          gsap.to(shapeEls, {
            scale: 0.8,
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => shape.classList.remove("active"),
            overwrite: "auto",
          });
        };

        item.addEventListener("mouseenter", onEnter);
        item.addEventListener("mouseleave", onLeave);

        (item as HTMLElement & { _cleanup?: () => void })._cleanup = () => {
          item.removeEventListener("mouseenter", onEnter);
          item.removeEventListener("mouseleave", onLeave);
        };
      });
    }, containerRef);

    return () => {
      ctx.revert();

      if (containerRef.current) {
        const items = containerRef.current.querySelectorAll(
          ".menu-list-item[data-shape]",
        );

        items.forEach((item) =>
          (item as HTMLElement & { _cleanup?: () => void })._cleanup?.(),
        );
      }
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const navWrap = containerRef.current!.querySelector(
        ".nav-overlay-wrapper",
      );
      const menu = containerRef.current!.querySelector(".menu-content");
      const overlay = containerRef.current!.querySelector(".overlay");
      const bgPanels = containerRef.current!.querySelectorAll(".backdrop-layer");
      const menuItems = containerRef.current!.querySelectorAll(".menu-list-item");
      const fadeTargets =
        containerRef.current!.querySelectorAll("[data-menu-fade]");

      const menuButton = containerRef.current!.querySelector(".nav-close-btn");
      const navWrapTarget = navWrap ? [navWrap] : [];
      const menuTarget = menu ? [menu] : [];
      const overlayTarget = overlay ? [overlay] : [];
      const menuButtonTexts = menuButton
        ? menuButton.querySelectorAll("p")
        : [];
      const menuButtonIcon = menuButton
        ? [menuButton.querySelector(".menu-button-icon")].filter(Boolean)
        : [];

      const tl = gsap.timeline();

      if (isMenuOpen) {
        hasOpenedRef.current = true;

        if (navWrap) navWrap.setAttribute("data-nav", "open");

        tl.set(navWrapTarget, { display: "block" })
          .fromTo(menuTarget, { x: "120%" }, { x: "0%" }, "<")
          .fromTo(menuButtonTexts, { yPercent: 0 }, { yPercent: -100, stagger: 0.2 })
          .fromTo(menuButtonIcon, { rotate: 0 }, { rotate: 315 }, "<")
          .fromTo(overlayTarget, { autoAlpha: 0 }, { autoAlpha: 1 }, "<")
          .fromTo(
            bgPanels,
            { xPercent: 101 },
            { xPercent: 0, stagger: 0.12, duration: 0.575 },
            "<",
          )
          .fromTo(
            menuItems,
            { autoAlpha: 0, y: 18 },
            { autoAlpha: 1, y: 0, stagger: 0.05 },
            "<+=0.35",
          );

        if (fadeTargets.length) {
          tl.fromTo(
            fadeTargets,
            { autoAlpha: 0, yPercent: 50 },
            {
              autoAlpha: 1,
              yPercent: 0,
              stagger: 0.04,
              clearProps: "all",
            },
            "<+=0.2",
          );
        }
      } else {
        if (navWrap) navWrap.setAttribute("data-nav", "closed");

        if (!hasOpenedRef.current) {
          gsap.set(navWrapTarget, { display: "none" });
          gsap.set(menuTarget, { x: "120%" });
          gsap.set(overlayTarget, { autoAlpha: 0 });
          gsap.set(menuButtonTexts, { yPercent: 0 });
          gsap.set(menuButtonIcon, { rotate: 0 });
          return;
        }

        tl.to(overlayTarget, { autoAlpha: 0 })
          .to(menuTarget, { x: "120%" }, "<")
          .to(menuButtonTexts, { yPercent: 0 }, "<")
          .to(menuButtonIcon, { rotate: 0 }, "<")
          .set(navWrapTarget, { display: "none" });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [isMenuOpen]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("nav-menu-open", isMenuOpen);

    return () => {
      document.body.classList.remove("nav-menu-open");
    };
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div ref={containerRef}>
      <div className="site-header-wrapper">
        <header className="header">
          <div className="container is--full">
            <nav className="nav-row">
              <Link href="/" aria-label="home" className="nav-logo-row w-inline-block">
                <span className="nav-logo-text p-large">HumanTouch</span>
              </Link>

              <div className="nav-row__right">
                <button
                  type="button"
                  className="nav-close-btn"
                  onClick={toggleMenu}
                  aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                  aria-expanded={isMenuOpen}
                  aria-controls="kinetic-navigation-menu"
                >
                  <span className="menu-button-text">
                    <p className="p-large">Menu</p>
                    <p className="p-large">Close</p>
                  </span>
                  <span className="icon-wrap" aria-hidden="true">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="100%"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="menu-button-icon"
                    >
                      <path
                        d="M7.33333 16L7.33333 -3.2055e-07L8.66667 -3.78832e-07L8.66667 16L7.33333 16Z"
                        fill="currentColor"
                      />
                      <path
                        d="M16 8.66667L-2.62269e-07 8.66667L-3.78832e-07 7.33333L16 7.33333L16 8.66667Z"
                        fill="currentColor"
                      />
                      <path
                        d="M6 7.33333L7.33333 7.33333L7.33333 6C7.33333 6.73637 6.73638 7.33333 6 7.33333Z"
                        fill="currentColor"
                      />
                      <path
                        d="M10 7.33333L8.66667 7.33333L8.66667 6C8.66667 6.73638 9.26362 7.33333 10 7.33333Z"
                        fill="currentColor"
                      />
                      <path
                        d="M6 8.66667L7.33333 8.66667L7.33333 10C7.33333 9.26362 6.73638 8.66667 6 8.66667Z"
                        fill="currentColor"
                      />
                      <path
                        d="M10 8.66667L8.66667 8.66667L8.66667 10C8.66667 9.26362 9.26362 8.66667 10 8.66667Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </nav>
          </div>
        </header>
      </div>

      <section className="fullscreen-menu-container">
        <div
          id="kinetic-navigation-menu"
          data-nav="closed"
          className="nav-overlay-wrapper"
        >
          <button
            type="button"
            className="overlay"
            onClick={closeMenu}
            aria-label="Close navigation menu"
          />

          <nav className="menu-content" aria-label="Primary navigation">
            <div className="menu-bg">
              <div className="backdrop-layer first" />
              <div className="backdrop-layer second" />
              <div className="backdrop-layer" />

              <div className="ambient-background-shapes" aria-hidden="true">
                <svg className="bg-shape bg-shape-1" viewBox="0 0 400 400" fill="none">
                  <circle className="shape-element" cx="80" cy="120" r="40" fill="rgba(99,102,241,0.15)" />
                  <circle className="shape-element" cx="300" cy="80" r="60" fill="rgba(139,92,246,0.12)" />
                  <circle className="shape-element" cx="200" cy="300" r="80" fill="rgba(236,72,153,0.1)" />
                  <circle className="shape-element" cx="350" cy="280" r="30" fill="rgba(99,102,241,0.15)" />
                </svg>

                <svg className="bg-shape bg-shape-2" viewBox="0 0 400 400" fill="none">
                  <path className="shape-element" d="M0 200 Q100 100, 200 200 T 400 200" stroke="rgba(99,102,241,0.2)" strokeWidth="60" fill="none" />
                  <path className="shape-element" d="M0 280 Q100 180, 200 280 T 400 280" stroke="rgba(139,92,246,0.15)" strokeWidth="40" fill="none" />
                </svg>

                <svg className="bg-shape bg-shape-3" viewBox="0 0 400 400" fill="none">
                  <circle className="shape-element" cx="50" cy="50" r="8" fill="rgba(99,102,241,0.3)" />
                  <circle className="shape-element" cx="150" cy="50" r="8" fill="rgba(139,92,246,0.3)" />
                  <circle className="shape-element" cx="250" cy="50" r="8" fill="rgba(236,72,153,0.3)" />
                  <circle className="shape-element" cx="350" cy="50" r="8" fill="rgba(99,102,241,0.3)" />
                  <circle className="shape-element" cx="100" cy="150" r="12" fill="rgba(139,92,246,0.25)" />
                  <circle className="shape-element" cx="200" cy="150" r="12" fill="rgba(236,72,153,0.25)" />
                  <circle className="shape-element" cx="300" cy="150" r="12" fill="rgba(99,102,241,0.25)" />
                  <circle className="shape-element" cx="50" cy="250" r="10" fill="rgba(236,72,153,0.3)" />
                  <circle className="shape-element" cx="150" cy="250" r="10" fill="rgba(99,102,241,0.3)" />
                  <circle className="shape-element" cx="250" cy="250" r="10" fill="rgba(139,92,246,0.3)" />
                  <circle className="shape-element" cx="350" cy="250" r="10" fill="rgba(236,72,153,0.3)" />
                  <circle className="shape-element" cx="100" cy="350" r="6" fill="rgba(99,102,241,0.3)" />
                  <circle className="shape-element" cx="200" cy="350" r="6" fill="rgba(139,92,246,0.3)" />
                  <circle className="shape-element" cx="300" cy="350" r="6" fill="rgba(236,72,153,0.3)" />
                </svg>

                <svg className="bg-shape bg-shape-4" viewBox="0 0 400 400" fill="none">
                  <path className="shape-element" d="M100 100 Q150 50, 200 100 Q250 150, 200 200 Q150 250, 100 200 Q50 150, 100 100" fill="rgba(99,102,241,0.12)" />
                  <path className="shape-element" d="M250 200 Q300 150, 350 200 Q400 250, 350 300 Q300 350, 250 300 Q200 250, 250 200" fill="rgba(236,72,153,0.1)" />
                </svg>

                <svg className="bg-shape bg-shape-5" viewBox="0 0 400 400" fill="none">
                  <line className="shape-element" x1="0" y1="100" x2="300" y2="400" stroke="rgba(99,102,241,0.15)" strokeWidth="30" />
                  <line className="shape-element" x1="100" y1="0" x2="400" y2="300" stroke="rgba(139,92,246,0.12)" strokeWidth="25" />
                  <line className="shape-element" x1="200" y1="0" x2="400" y2="200" stroke="rgba(236,72,153,0.1)" strokeWidth="20" />
                </svg>
              </div>
            </div>

            <div className="menu-content-wrapper">
              <ul className="menu-list">
                <li className="menu-list-item" data-shape="1">
                  <Link
                    href="/agents"
                    className="nav-link w-inline-block"
                    data-active={isActiveRoute("/agents")}
                    aria-current={isActiveRoute("/agents") ? "page" : undefined}
                    onClick={closeMenu}
                  >
                    <span className="nav-link-text-wrap">
                      <span className="nav-link-text is-base">Agents</span>
                      <span className="nav-link-text is-hover">Agents</span>
                    </span>
                    <div className="nav-link-hover-bg" />
                  </Link>
                </li>
                <li className="menu-list-item" data-shape="2">
                  <Link
                    href="/sessions"
                    className="nav-link w-inline-block"
                    data-active={isActiveRoute("/sessions")}
                    aria-current={isActiveRoute("/sessions") ? "page" : undefined}
                    onClick={closeMenu}
                  >
                    <span className="nav-link-text-wrap">
                      <span className="nav-link-text is-base">Sessions</span>
                      <span className="nav-link-text is-hover">Sessions</span>
                    </span>
                    <div className="nav-link-hover-bg" />
                  </Link>
                </li>
                <li className="menu-list-item" data-shape="3">
                  <Link
                    href="/assignments"
                    className="nav-link w-inline-block"
                    data-active={isActiveRoute("/assignments")}
                    aria-current={isActiveRoute("/assignments") ? "page" : undefined}
                    onClick={closeMenu}
                  >
                    <span className="nav-link-text-wrap">
                      <span className="nav-link-text is-base">Assignments</span>
                      <span className="nav-link-text is-hover">Assignments</span>
                    </span>
                    <div className="nav-link-hover-bg" />
                  </Link>
                </li>
                <li className="menu-list-item" data-shape="4">
                  <Link
                    href="/integrations"
                    className="nav-link w-inline-block"
                    data-active={isActiveRoute("/integrations")}
                    aria-current={isActiveRoute("/integrations") ? "page" : undefined}
                    onClick={closeMenu}
                  >
                    <span className="nav-link-text-wrap" data-menu-fade>
                      <span className="nav-link-text is-base">Integrations</span>
                      <span className="nav-link-text is-hover">Integrations</span>
                    </span>
                    <div className="nav-link-hover-bg" />
                  </Link>
                </li>
                <li className="menu-list-item" data-shape="5">
                  <Link
                    href="/settings"
                    className="nav-link w-inline-block"
                    data-active={isActiveRoute("/settings")}
                    aria-current={isActiveRoute("/settings") ? "page" : undefined}
                    onClick={closeMenu}
                  >
                    <span className="nav-link-text-wrap">
                      <span className="nav-link-text is-base">Settings</span>
                      <span className="nav-link-text is-hover">Settings</span>
                    </span>
                    <div className="nav-link-hover-bg" />
                  </Link>
                </li>
                {currentUser && (
                  <li className="menu-list-item menu-account-item">
                    <div className="menu-account" aria-label="Current profile">
                      <span className="menu-account-name" title={profileName}>
                        {profileName}
                      </span>
                      <button
                        type="button"
                        className="menu-logout-btn"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        aria-label="Log out"
                        title="Log out"
                      >
                        <LogOut className="menu-logout-icon" aria-hidden="true" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </nav>
        </div>
      </section>
    </div>
  );
}

export function Component() {
  return <main className="kinetic-navigation" />;
}
