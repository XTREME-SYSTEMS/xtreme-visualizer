export type ScreenKey = 'home'|'scan'|'visualizer'|'compare'|'blends'|'metallic'|'products'|'quote'|'proposal'|'lead'|'integrations';
export interface Hotspot { label: string; x: number; y: number; w: number; h: number; action: string; }
export interface ScreenConfig { key: ScreenKey; title: string; image: string; route: string; hotspots: Hotspot[]; }
const navY=89.2, navH=7;
export const screens: ScreenConfig[] = [
 {key:'home',title:'Home Hub',image:'/screens/01-home-hub.png',route:'/app/home',hotspots:[
  {label:'New visualization',x:16,y:30,w:34,h:5,action:'go:scan'},
  {label:'Scan space',x:13,y:37,w:20,h:10,action:'go:scan'},
  {label:'Compare finishes',x:33,y:37,w:20,h:10,action:'go:compare'},
  {label:'Quote range',x:53,y:37,w:20,h:10,action:'go:quote'},
  {label:'Share proposal',x:73,y:37,w:15,h:10,action:'go:proposal'},
  {label:'Home',x:11,y:navY,w:17,h:navH,action:'go:home'},{label:'Visualize',x:28,y:navY,w:18,h:navH,action:'go:visualizer'},{label:'Products',x:46,y:navY,w:18,h:navH,action:'go:products'},{label:'Quotes',x:64,y:navY,w:17,h:navH,action:'go:quote'},{label:'Settings',x:81,y:navY,w:9,h:navH,action:'drawer:settings'}]},
 {key:'scan',title:'Room Scan',image:'/screens/02-room-scan.png',route:'/app/scan',hotspots:[
  {label:'Auto detect',x:13,y:51,w:20,h:10,action:'drawer:scan'},{label:'Refine mask',x:33,y:51,w:20,h:10,action:'drawer:scan'},{label:'Draw area',x:53,y:51,w:20,h:10,action:'drawer:scan'},{label:'Measure',x:73,y:51,w:16,h:10,action:'drawer:scan'},
  {label:'Capture photo',x:13,y:82,w:75,h:6,action:'drawer:scan'},
  {label:'Home',x:11,y:navY,w:17,h:navH,action:'go:home'},{label:'Scan',x:28,y:navY,w:18,h:navH,action:'go:scan'},{label:'Systems',x:46,y:navY,w:18,h:navH,action:'go:products'},{label:'Quote',x:64,y:navY,w:17,h:navH,action:'go:quote'},{label:'More',x:81,y:navY,w:9,h:navH,action:'drawer:settings'}]},
 {key:'visualizer',title:'Live Visualizer',image:'/screens/03-live-visualizer.png',route:'/app/visualizer',hotspots:[
  {label:'Before',x:13,y:44,w:25,h:5,action:'drawer:visualizer'},{label:'After',x:38,y:44,w:25,h:5,action:'drawer:visualizer'},{label:'Split view',x:63,y:44,w:25,h:5,action:'drawer:visualizer'},
  {label:'Save visualization',x:13,y:79,w:36,h:7,action:'save:visualization'},{label:'Build quote',x:51,y:79,w:37,h:7,action:'go:quote'},
  {label:'Home',x:11,y:navY,w:17,h:navH,action:'go:home'},{label:'Visualize',x:28,y:navY,w:18,h:navH,action:'go:visualizer'},{label:'Colors',x:46,y:navY,w:18,h:navH,action:'go:products'},{label:'Quote',x:64,y:navY,w:17,h:navH,action:'go:quote'},{label:'Settings',x:81,y:navY,w:9,h:navH,action:'drawer:settings'}]},
 {key:'compare',title:'Compare Finishes',image:'/screens/04-compare.png',route:'/app/compare',hotspots:[
  {label:'Edit room',x:66,y:15,w:20,h:5,action:'drawer:compare'},{label:'Compare fullscreen',x:13,y:79,w:37,h:7,action:'drawer:compare'},{label:'Send to customer',x:51,y:79,w:37,h:7,action:'share:compare'},
  {label:'Home',x:11,y:navY,w:17,h:navH,action:'go:home'},{label:'Compare',x:28,y:navY,w:18,h:navH,action:'go:compare'},{label:'Products',x:46,y:navY,w:18,h:navH,action:'go:products'},{label:'Share',x:64,y:navY,w:17,h:navH,action:'go:proposal'},{label:'More',x:81,y:navY,w:9,h:navH,action:'drawer:settings'}]},
 {key:'blends',title:'Flake Blend Studio',image:'/screens/05-flake-studio.png',route:'/app/blends',hotspots:[
  {label:'Explore blends',x:13,y:35,w:75,h:13,action:'drawer:colors'},{label:'Save favorite',x:13,y:77,w:24,h:10,action:'save:favorite'},{label:'Add to visual',x:38,y:77,w:24,h:10,action:'go:visualizer'},{label:'Attach to quote',x:63,y:77,w:25,h:10,action:'go:quote'},
  {label:'Home',x:11,y:navY,w:17,h:navH,action:'go:home'},{label:'Blends',x:28,y:navY,w:18,h:navH,action:'go:blends'},{label:'Visualize',x:46,y:navY,w:18,h:navH,action:'go:visualizer'},{label:'Quote',x:64,y:navY,w:17,h:navH,action:'go:quote'},{label:'Settings',x:81,y:navY,w:9,h:navH,action:'drawer:settings'}]},
 {key:'metallic',title:'Metallic Studio',image:'/screens/06-metallic-studio.png',route:'/app/metallic',hotspots:[
  {label:'Metallic finishes',x:13,y:44,w:75,h:10,action:'drawer:colors'},{label:'Floor controls',x:13,y:55,w:75,h:10,action:'drawer:visualizer'},{label:'Save scene',x:13,y:79,w:37,h:7,action:'save:visualization'},{label:'Share mockup',x:51,y:79,w:37,h:7,action:'share:compare'},
  {label:'Home',x:11,y:navY,w:17,h:navH,action:'go:home'},{label:'Metallic',x:28,y:navY,w:18,h:navH,action:'go:metallic'},{label:'Preview',x:46,y:navY,w:18,h:navH,action:'go:visualizer'},{label:'Share',x:64,y:navY,w:17,h:navH,action:'go:proposal'},{label:'More',x:81,y:navY,w:9,h:navH,action:'drawer:settings'}]},
 {key:'products',title:'Products & Colors',image:'/screens/07-products-colors.png',route:'/app/products',hotspots:[
  {label:'Catalog tabs',x:12,y:13,w:76,h:7,action:'drawer:catalog'},{label:'Browse catalog',x:12,y:20,w:76,h:58,action:'drawer:catalog'},{label:'Attach to visualization',x:13,y:83,w:75,h:6,action:'go:visualizer'},
  {label:'Home',x:11,y:navY,w:17,h:navH,action:'go:home'},{label:'Products',x:28,y:navY,w:18,h:navH,action:'go:products'},{label:'Visualize',x:46,y:navY,w:18,h:navH,action:'go:visualizer'},{label:'Quote',x:64,y:navY,w:17,h:navH,action:'go:quote'},{label:'Settings',x:81,y:navY,w:9,h:navH,action:'drawer:settings'}]},
 {key:'quote',title:'Smart Quote',image:'/screens/08-smart-quote.png',route:'/app/quote',hotspots:[
  {label:'Edit project',x:66,y:29,w:20,h:5,action:'drawer:quote'},{label:'Edit quote',x:13,y:32,w:75,h:46,action:'drawer:quote'},{label:'Generate proposal',x:13,y:81,w:45,h:7,action:'generate:proposal'},{label:'Save draft',x:59,y:81,w:29,h:7,action:'save:quote'},
  {label:'Home',x:11,y:navY,w:17,h:navH,action:'go:home'},{label:'Quote',x:28,y:navY,w:18,h:navH,action:'go:quote'},{label:'Products',x:46,y:navY,w:18,h:navH,action:'go:products'},{label:'Share',x:64,y:navY,w:17,h:navH,action:'go:proposal'},{label:'Settings',x:81,y:navY,w:9,h:navH,action:'drawer:settings'}]},
 {key:'proposal',title:'Proposal Share',image:'/screens/09-proposal-share.png',route:'/app/proposal',hotspots:[
  {label:'Proposal details',x:13,y:13,w:75,h:65,action:'drawer:proposal'},{label:'Share link',x:13,y:80,w:24,h:9,action:'share:proposal'},{label:'Download',x:38,y:80,w:24,h:9,action:'download:proposal'},{label:'Request signature',x:63,y:80,w:25,h:9,action:'sign:proposal'},
  {label:'Home',x:11,y:navY,w:17,h:navH,action:'go:home'},{label:'Proposal',x:28,y:navY,w:18,h:navH,action:'go:proposal'},{label:'Share',x:46,y:navY,w:18,h:navH,action:'share:proposal'},{label:'Sign',x:64,y:navY,w:17,h:navH,action:'sign:proposal'},{label:'More',x:81,y:navY,w:9,h:navH,action:'drawer:settings'}]},
 {key:'lead',title:'Onsite Lead Capture',image:'/screens/10-lead-capture.png',route:'/app/lead',hotspots:[
  {label:'Lead details',x:13,y:13,w:75,h:55,action:'drawer:lead'},{label:'Start visualization',x:13,y:79,w:27,h:8,action:'go:scan'},{label:'Save lead',x:41,y:79,w:23,h:8,action:'save:lead'},{label:'Send follow up',x:65,y:79,w:23,h:8,action:'share:followup'},
  {label:'Home',x:11,y:navY,w:17,h:navH,action:'go:home'},{label:'Leads',x:28,y:navY,w:18,h:navH,action:'go:lead'},{label:'Visualize',x:46,y:navY,w:18,h:navH,action:'go:visualizer'},{label:'Tasks',x:64,y:navY,w:17,h:navH,action:'drawer:lead'},{label:'Settings',x:81,y:navY,w:9,h:navH,action:'drawer:settings'}]}
];
export const screenByKey = Object.fromEntries(screens.map(s => [s.key, s])) as Record<ScreenKey, ScreenConfig>;