// The network's icons, one place. Every drawing is one path on a 24-unit grid: the UI icons are
// stroked (currentColor, 1.6, round), in the form the admin menus already drew (txasm, Carrel, the
// Portal); the social marks are filled. Gathered from the sites' own inline SVGs (txasm's admin menu,
// Foxing's account panel and header, julieedwards.info's header and priorities, the germomics and bsw footers), so
// a site that moves onto them looks the same. A site's own mark (its logo) stays the site's.
//
// The pictograms Foxhound, germomics and bsw drew with lucide-react (the ones the set lacked, from
// account to webhook) are Lucide's drawings, each one's elements joined into one path. Lucide is ISC
// licensed (some of its icons MIT, from Feather); both notices are in LICENSE-lucide.txt beside this file.
//
// Each drawing is its own export, so a site's bundle holds only the icons it imports (an `Icon`
// that looked a name up in one table shipped all of them to every site). UI icons are `icon` and
// the name; the social marks are `mark` and the name, each with `fill`, so they spread onto `Icon`.

export const iconAccount =
  "M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0M9 10a3 3 0 1 0 6 0a3 3 0 1 0-6 0M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662";
export const iconActivity =
  "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2";
export const iconAdd = "M12 5v14M5 12h14";
export const iconAlert = "M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0M12 8L12 12M12 16L12.01 16";
export const iconAntenna = "M2 12 7 2M7 12l5-10M12 12l5-10M17 12l5-10M4.5 7h15M12 16v6";
export const iconArrowLeft = "M19 12H5M11 6l-6 6 6 6";
export const iconArrowRight = "M5 12h14M13 6l6 6-6 6";
export const iconArrowUpRight = "M7 7h10v10M7 17 17 7";
export const iconAssign = "M8 4.5h8v3H8zM6 6H4.5v14.5h15V6H18M8.5 12.5h7M8.5 16h4";
export const iconAward =
  "M12 3.5a5 5 0 1 0 0 10a5 5 0 1 0 0-10zM8.8 12.4 7.5 20.5l4.5-2.5 4.5 2.5-1.3-8.1";
export const iconBanknote =
  "M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-16a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM10 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0M6 12h.01M18 12h.01";
export const iconBell = "M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0";
export const iconBook =
  "M4.5 5c2.6-1 5.2-.8 7.5.8 2.3-1.6 4.9-1.8 7.5-.8v13.5c-2.6-1-5.2-.8-7.5.8-2.3-1.6-4.9-1.8-7.5-.8zM12 5.8v13.5";
export const iconBrake =
  "M10 15V9M14 15V9M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z";
export const iconBug =
  "M12 20v-9M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4zM14.12 3.88 16 2M21 21a4 4 0 0 0-3.81-4M21 5a4 4 0 0 1-3.55 3.97M22 13h-4M3 21a4 4 0 0 1 3.81-4M3 5a4 4 0 0 0 3.55 3.97M6 13H2M8 2l1.88 1.88M9 7.13V6a3 3 0 1 1 6 0v1.13";
export const iconBuilding =
  "M10 12h4M10 8h4M14 21v-3a2 2 0 0 0-4 0v3M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16";
export const iconCalendar = "M4.5 5.5h15v14h-15zM4.5 10h15M8.5 3.5v4M15.5 3.5v4";
export const iconCalendarClock =
  "M16 14v2.2l1.6 1M16 2v3M21 7.338V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h2.338M3 9h5.859M8 2v3M10 16a6 6 0 1 0 12 0a6 6 0 1 0-12 0";
export const iconCaptions =
  "M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-14a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2zM7 15h4M15 15h2M7 11h2M13 11h4";
export const iconCard =
  "M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-16a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2zM2 10L22 10M6 14h2";
export const iconCheck = "M5 12.5l4.5 4.5L19 7.5";
export const iconChevronDown = "m6 9 6 6 6-6";
export const iconChevronLeft = "m15 6-6 6 6 6";
export const iconChevronRight = "m9 6 6 6-6 6";
export const iconChevronUp = "m6 15 6-6 6 6";
export const iconChevronsLeft = "m11.5 18-6-6 6-6M18.5 18l-6-6 6-6";
export const iconChevronsRight = "m5.5 18 6-6-6-6M12.5 18l6-6-6-6";
export const iconCircle = "M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0";
export const iconClock = "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17zM12 7.5V12l3 2";
export const iconClose = "M6 6l12 12M18 6 6 18";
export const iconCloudUpload =
  "M12 13v8M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M8 17l4-4 4 4";
export const iconCopy = "M9 9h11v11H9zM5 15H4V4h11v1";
export const iconCut =
  "M3 6a3 3 0 1 0 6 0a3 3 0 1 0-6 0M8.12 8.12 12 12M20 4 8.12 15.88M3 18a3 3 0 1 0 6 0a3 3 0 1 0-6 0M14.8 14.8 20 20";
export const iconDatabase =
  "M3 5a9 3 0 1 0 18 0a9 3 0 1 0-18 0M3 5V19A9 3 0 0 0 21 19V5M3 12A9 3 0 0 0 21 12";
export const iconDecide = "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17zM8 12.2l2.8 2.8L16.2 9.5";
export const iconDisc =
  "M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0M6 12c0-1.7.7-3.2 1.8-4.2M10 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0M18 12c0 1.7-.7 3.2-1.8 4.2";
export const iconDna =
  "m10 16 1.5 1.5M14 8l-1.5-1.5M15 2c-1.798 1.998-2.518 3.995-2.807 5.993M16.5 10.5l1 1M17 6l-2.891-2.891M2 15c6.667-6 13.333 0 20-6M20 9l.891.891M3.109 14.109 4 15M6.5 12.5l1 1M7 18l2.891 2.891M9 22c1.798-1.998 2.518-3.995 2.807-5.993";
export const iconDocument = "M6 3.5h8l4 4v13H6zM14 3.5v4h4M9 12h6M9 15.5h6";
export const iconDownload = "M12 4v11M7 10l5 5 5-5M5 20h14";
export const iconEdit =
  "M13 21h8M15 5l4 4M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z";
export const iconExternal =
  "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5";
export const iconFastForward = "M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5";
export const iconFileAudio =
  "M4 6.835V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2h-.343M14 2v5a1 1 0 0 0 1 1h5M2 19a2 2 0 0 1 4 0v1a2 2 0 0 1-4 0v-4a6 6 0 0 1 12 0v4a2 2 0 0 1-4 0v-1a2 2 0 0 1 4 0";
export const iconFileCheck =
  "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 15l2 2 4-4";
export const iconFileUp =
  "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2zM14 2v5a1 1 0 0 0 1 1h5M12 12v6M15 15l-3-3-3 3";
export const iconFolder =
  "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z";
export const iconGamepad =
  "M6 11L10 11M8 9L8 13M15 12L15.01 12M18 10L18.01 10M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z";
export const iconGlobe =
  "M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20";
export const iconGoals =
  "M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16zM12 8.8a3.2 3.2 0 1 0 0 6.4a3.2 3.2 0 1 0 0-6.4z";
export const iconGraduation = "M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c0 1 2 3 6 3s6-2 6-3v-5";
export const iconHeadphones =
  "M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3";
export const iconHeart =
  "M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.5 4.5 4.5 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z";
export const iconHome = "M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4z";
export const iconIdea =
  "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4";
export const iconImageUp =
  "M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21M14 19.5l3-3 3 3M17 22v-5.5M7 9a2 2 0 1 0 4 0a2 2 0 1 0-4 0";
export const iconInfo = "M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0M12 16v-4M12 8h.01";
export const iconInspect =
  "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M16 16l-1.9-1.9";
export const iconKey =
  "m2 21 9.6-9.6M7.5 15.5l2.3 2.3a1 1 0 0 1 0 1.4l-2.1 2.1a1 1 0 0 1-1.4 0L4 19M10 7.5a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0-11 0";
export const iconLibrary = "m16 6 4 14M12 6v14M8 8v12M4 4v16";
export const iconLink = "M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 1 1 0 10h-2M8 12L16 12";
export const iconList = "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01";
export const iconListChecks = "M13 5h8M13 12h8M13 19h8M3 17l2 2 4-4M3 7l2 2 4-4";
export const iconListOrdered =
  "M11 5h10M11 12h10M11 19h10M4 4h1v5M4 9h2M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02";
export const iconListTree = "M8 5h13M13 12h8M13 19h8M3 10a2 2 0 0 0 2 2h3M3 5v12a2 2 0 0 0 2 2h3";
export const iconLock =
  "M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-14a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0v4";
export const iconMail = "M3.5 5.5h17v13h-17zM3.5 6l8.5 7 8.5-7";
export const iconMegaphone =
  "M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14M8 6v8";
export const iconMenu = "M4 7h16M4 12h16M4 17h16";
export const iconMic =
  "M12 19v3M19 10v2a7 7 0 0 1-14 0v-2M12 2h0a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h0a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3z";
export const iconMoon = "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z";
export const iconMusic =
  "M21 16V3a1 1 0 0 0-1.28-.96l-10 2.917a1 1 0 0 0-.72.96V19M15 16a3 3 0 1 0 6 0a3 3 0 1 0-6 0M3 19a3 3 0 1 0 6 0a3 3 0 1 0-6 0";
export const iconMusicNote = "m19 6-5.2-3.9a.5.5 0 0 0-.8.4V18M5 18a4 4 0 1 0 8 0a4 4 0 1 0-8 0";
export const iconMute = "M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6";
export const iconOverview = "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z";
export const iconPaste =
  "M11 14h10M16 4h2a2 2 0 0 1 2 2v1.344M17 18l4-4-4-4M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 1.793-1.113M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z";
export const iconPause = "M7 4h3.5v16H7zM13.5 4H17v16h-3.5z";
export const iconPeople =
  "M9 4.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7zM2.5 19.5c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5M15.5 4.8a3.5 3.5 0 0 1 0 6.4M18 14.5c1.8.8 3 2.5 3.5 5";
export const iconPercent =
  "M19 5L5 19M4 6.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M15 17.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0";
export const iconPhone =
  "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2v-16a2 2 0 0 1 2-2zM12 18h.01";
export const iconPlay =
  "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z";
export const iconPlug =
  "M12 22v-5M15 8V2M17 8a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1zM9 8V2";
export const iconPodcast =
  "M12 17v4M18 11a6 6 0 00-3-5.197M2 11a10 10 0 015-8.662M22 11a10 10 0 00-5-8.662M6 11a6 6 0 013-5.197M9 21h6M12 9h0a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z";
export const iconQueue = "M3.5 13.5 6 5.5h12l2.5 8v5h-17zM3.5 13.5h5l1 2h5l1-2h5";
export const iconQuote =
  "M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2zM5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z";
export const iconRadio =
  "M16.247 7.761a6 6 0 0 1 0 8.478M19.075 4.933a10 10 0 0 1 0 14.134M4.925 19.067a10 10 0 0 1 0-14.134M7.753 16.239a6 6 0 0 1 0-8.478M10 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0";
export const iconReceipt =
  "M12 17V7M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z";
export const iconRefresh =
  "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5";
export const iconRepeat =
  "m17 2 4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3";
export const iconReset = "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5";
export const iconRewind = "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5";
export const iconRoles =
  "M10 4.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7zM3.5 19.5c.8-3.5 3.3-5.5 6.5-5.5 1.5 0 2.8.4 3.9 1.2M15 18l2 2 4-4";
export const iconRss = "M5 5a14 14 0 0 1 14 14M5 11a8 8 0 0 1 8 8M5.5 18.5h.01";
export const iconSave =
  "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7M7 3v4a1 1 0 0 0 1 1h7";
export const iconScale =
  "M12 3v18M19 8l3 8a5 5 0 0 1-6 0zV7M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1M5 8l3 8a5 5 0 0 1-6 0zV7M7 21h10";
export const iconScanSearch =
  "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M16 16l-1.9-1.9";
export const iconScroll =
  "M15 12h-5M15 8h-5M19 17V5a2 2 0 0 0-2-2H4M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3";
export const iconSearch = "M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-3.2-3.2";
export const iconSend =
  "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zM21.854 2.147l-10.94 10.939";
export const iconSettings =
  "M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8";
export const iconShare =
  "M15 5a3 3 0 1 0 6 0a3 3 0 1 0-6 0M3 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M15 19a3 3 0 1 0 6 0a3 3 0 1 0-6 0M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49";
export const iconShield =
  "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z";
export const iconShieldCheck =
  "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1zM9 12l2 2 4-4";
export const iconSkipNext = "M5 4.5v15l10-7.5zM19 5v14";
export const iconSliders = "M10 5H3M12 19H3M14 3v4M16 17v4M21 12h-9M21 19h-5M21 5h-7M8 10v4M8 12H3";
export const iconSpinner = "M21 12a9 9 0 1 1-6.219-8.56";
export const iconStar =
  "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z";
export const iconStats = "M5 20V11M12 20V5M19 20v-6";
export const iconStore =
  "M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05";
export const iconSun =
  "M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4";
export const iconTag = "M3.5 3.5h8l9 9-8 8-9-9zM8 7.5h.01";
export const iconTicket = "M3.5 7.5h17v3a1.5 1.5 0 0 0 0 3v3h-17v-3a1.5 1.5 0 0 0 0-3zM14.5 7.5v9";
export const iconTimer = "M10 2h4M12 14l3-3M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z";
export const iconTrash =
  "M10 11v6M14 11v6M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2";
export const iconTrendingDown = "M16 17h6v-6M22 17l-8.5-8.5-5 5L2 7";
export const iconTrendingUp = "M16 7h6v6M22 7l-8.5 8.5-5-5L2 17";
export const iconTrophy =
  "M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3M4 22h16M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zM6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3";
export const iconUndo = "M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11";
export const iconUpload = "M12 3v12M17 8l-5-5-5 5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4";
export const iconUser = "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M8 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0";
export const iconUserCheck =
  "m16 11 2 2 4-4M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0";
export const iconUserPlus =
  "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0M19 8L19 14M22 11L16 11";
export const iconVolume = "M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14";
export const iconWarning =
  "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01";
export const iconWebhook =
  "M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2M6 17l3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06M12 6l3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8";

export const markFacebook = {
  d: "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6 4.39 10.97 10.13 11.85v-8.38H7.08v-3.47h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.96h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.47h-2.8v8.38C19.61 23.04 24 18.07 24 12.07z",
  fill: true,
} as const;
export const markInstagram = {
  d: "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0-2.16C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.36-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z",
  fill: true,
} as const;
export const markLinkedin = {
  d: "M6.94 5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0zM3.5 8.5h3.3V21H3.5zm5.6 0h3.16v1.7h.05c.44-.83 1.5-1.7 3.1-1.7 3.32 0 3.93 2.18 3.93 5v6.5h-3.3v-5.76c0-1.37-.02-3.14-1.9-3.14-1.92 0-2.2 1.5-2.2 3.04V21H9.1z",
  fill: true,
} as const;
export const markX = {
  d: "M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93zM17.61 20.64h2.04L6.49 3.24H4.3z",
  fill: true,
} as const;

const NS = "http://www.w3.org/2000/svg";

// An icon as an <svg> element, built with the DOM (no markup string, so no Trusted Types sink), from
// its path: `iconSvg(iconSearch)`, or a social mark `iconSvg(markX.d, markX)`. It is hidden from
// assistive technology unless it is given a label, which names it as an image.
export function iconSvg(
  d: string,
  options: { label?: string; fill?: boolean; box?: number } = {},
): SVGSVGElement {
  const svg = document.createElementNS(NS, "svg");
  const box = options.box || 24;
  svg.setAttribute("class", "cap-icon");
  svg.setAttribute("viewBox", `0 0 ${box} ${box}`);
  if (options.fill) svg.setAttribute("data-fill", "");
  if (options.label) {
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", options.label);
  } else svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", d);
  svg.append(path);
  return svg;
}
