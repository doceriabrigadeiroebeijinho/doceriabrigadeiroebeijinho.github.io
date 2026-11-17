type IconName = "search"|"cake"|"sweet"|"gift"|"sparkles"|"clipboard"|"grid"|"user"|"bag";
export default function StorefrontIcon({name,size=21}:{name:IconName;size?:number}){
 const paths:Record<IconName,React.ReactNode>={
 search:<><circle cx="11" cy="11" r="7.5"/><path d="m16.6 16.6 4.2 4.2"/></>,
 cake:<><path d="M3 12h18v9H3z"/><path d="M3 16c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0"/><path d="M6 12V9.5c0-2 2-3 3.5-1.8 1.3-2 3.7-2 5 0 2-1.3 3.5-.1 3.5 1.8V12"/><path d="M12 6V3"/></>,
 sweet:<><path d="M5 12.5h14l-2 8H7z"/><path d="M4.5 12.5a3.3 3.3 0 0 1 1-6.4 3.7 3.7 0 0 1 5.5-2.4 3.8 3.8 0 0 1 5.8 2.4 3.3 3.3 0 0 1 2.7 6.4"/><path d="M9.5 15.5v2.5M14.5 15.5V18"/></>,
 gift:<><path d="M3 10h18v11H3z"/><path d="M2 6h20v4H2z"/><path d="M12 6v15"/><path d="M12 6C9 1 4 2 4 5c0 1 2 1 8 1ZM12 6c3-5 8-4 8-1 0 1-2 1-8 1Z"/></>,
 sparkles:<><path d="m12 2 2.7 6.3L21 11l-6.3 2.7L12 20l-2.7-6.3L3 11l6.3-2.7L12 2Z"/><path d="m20 18 .8 1.2L22 20l-1.2.8L20 22l-.8-1.2L18 20l1.2-.8L20 18Z"/></>,
 clipboard:<><rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 3h6v4H9zM9 11h6M9 15h6M9 19h3"/></>,
 grid:<><rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/></>,
 user:<><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
 bag:<><path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>
 };
 return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" focusable="false">{paths[name]}</svg>;
}
