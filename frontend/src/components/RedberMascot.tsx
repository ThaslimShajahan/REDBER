"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, ImagePlus } from "lucide-react";
import { API_BASE } from "../lib/api";
import * as THREE from "three";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents = {
    p: ({ node, ...props }: any) => <p className="mb-2 last:mb-0 leading-relaxed font-sans text-[0.92rem]" {...props} />,
    a: ({ node, ...props }: any) => <a target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4 break-words" {...props} />,
    strong: ({ node, ...props }: any) => <strong className="font-bold text-white" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="list-disc pl-4 mb-3 space-y-1 block" {...props} />,
    ol: ({ node, ...props }: any) => <ol className="list-decimal pl-4 mb-3 space-y-1 block" {...props} />,
    li: ({ node, ...props }: any) => <li className="leading-relaxed text-[0.9rem]" {...props} />,
};

class Spr {
    v: number; tgt: number; vel: number; freq: number; damp: number;
    constructor(v: number, freq = 5, damp = 1.0) { this.v = v; this.tgt = v; this.vel = 0; this.freq = freq; this.damp = damp; }
    set(x: number) { this.v = this.tgt = x; this.vel = 0; }
    step(dt: number) {
        const w = 2 * Math.PI * this.freq;
        this.vel += (w * w * (this.tgt - this.v) - 2 * this.damp * w * this.vel) * dt;
        this.v += this.vel * dt; return this.v;
    }
}

const BOT_ID = "redber-assistant-001";

// Shared drag state — lives outside React to bridge React pointerdown → Three.js animation loop
const drag = {
    active: false,
    worldX: 0, worldY: 0,
    startWorldY: 0,
    velY: 0,      // drag velocity (for throw)
    prevY: 0, prevT: 0,
};

export default function RedberMascot() {
    const [chatOpen, setChatOpen] = useState(false);
    const [hitArea, setHitArea] = useState({ x: -300, y: -300, w: 60, h: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [messages, setMessages] = useState<{ sender: string; text: string }[]>([
        { sender: "bot", text: "Hey! 👋 I'm Redber! Grab and throw me around, or ask me anything 😄" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const sessionId = useRef(`landing-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chatOpenRef = useRef(false);
    useEffect(() => { chatOpenRef.current = chatOpen; }, [chatOpen]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;
        const txt = input.trim(); setInput("");
        setMessages(p => [...p, { sender: "user", text: txt }]);
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/bots/chat`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: txt, bot_id: BOT_ID, session_id: sessionId.current, history: messages.map(m => ({ sender: m.sender, text: m.text })) }),
            });
            const d = await res.json();
            setMessages(p => [...p, { sender: "bot", text: d.reply ?? "Hmm... 🤔" }]);
        } catch { setMessages(p => [...p, { sender: "bot", text: "Brain glitch! 🤕 Try again." }]); }
        finally { setIsLoading(false); }
    };

    // Convert screen → world coordinates using the same unit as Three.js view
    function screenToWorld(sx: number, sy: number) {
        const unit = 110;
        const x = (sx / window.innerWidth - 0.5) * (window.innerWidth / unit);
        const y = -(sy / window.innerHeight - 0.5) * (window.innerHeight / unit);
        return { x, y };
    }

    // Global pointer events to track drag across the whole document
    useEffect(() => {
        const onMove = (e: PointerEvent) => {
            if (!drag.active) return;
            const now = performance.now() / 1000;
            const dt = Math.max(now - drag.prevT, 0.008);
            const wp = screenToWorld(e.clientX, e.clientY);
            drag.velY = (wp.y - drag.prevY) / dt;
            drag.prevY = wp.y; drag.prevT = now;
            drag.worldX = wp.x; drag.worldY = wp.y;
        };
        const onUp = () => {
            if (!drag.active) return;
            drag.active = false;
            setIsDragging(false);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    }, []);

    // Three.js mascot
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        let reqId = 0; let renderer: THREE.WebGLRenderer;

        const init = () => {
            const COL = { bodyDark: 0x0e0f1a, bodyMid: 0x151826, accent: 0x00eaff, accent2: 0x7a3dff, hot: 0x9fffff };

            renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.15;

            const scene = new THREE.Scene();
            let view = computeView();
            const cam = new THREE.OrthographicCamera(view.left, view.right, view.top, view.bottom, -100, 100);
            cam.position.set(0, 0, 10); cam.lookAt(0, 0, 0);

            function computeView() {
                const w = window.innerWidth, h = window.innerHeight, u = 110;
                return { left: -w/2/u, right: w/2/u, top: h/2/u, bottom: -h/2/u };
            }

            scene.add(new THREE.AmbientLight(0xffffff, 0.5));
            const key = new THREE.DirectionalLight(0xcfe0ff, 0.8); key.position.set(3, 5, 4); scene.add(key);
            const fill1 = new THREE.DirectionalLight(COL.accent, 0.55); fill1.position.set(-4, 1, 2); scene.add(fill1);
            const fill2 = new THREE.DirectionalLight(COL.accent2, 0.45); fill2.position.set(4, -1, 3); scene.add(fill2);

            // ── Build rig ──
            const mascot = new THREE.Group(); mascot.scale.setScalar(0.35); scene.add(mascot);
            const body = new THREE.Group(); mascot.add(body);
            const pelvis = new THREE.Group(); body.add(pelvis); pelvis.position.y = 0.62;
            const torso = new THREE.Group(); pelvis.add(torso);
            const chest = new THREE.Group(); torso.add(chest); chest.position.y = 0.35;
            const neck = new THREE.Group(); chest.add(neck); neck.position.y = 0.35;
            const head = new THREE.Group(); neck.add(head); head.position.y = 0.32;

            const torsoMat = new THREE.MeshStandardMaterial({ color: COL.bodyDark, roughness: 0.45, metalness: 0.2, emissive: new THREE.Color(0x020412), emissiveIntensity: 1.0 });
            const tGeo = new THREE.SphereGeometry(0.55, 48, 48); tGeo.scale(1, 1.15, 0.9);
            torso.add(new THREE.Mesh(tGeo, torsoMat));

            const bGeo = new THREE.SphereGeometry(0.58, 48, 48, 0, Math.PI*2, Math.PI*0.55, Math.PI*0.45); bGeo.scale(1, 1.15, 0.9);
            const bellyMat = new THREE.MeshBasicMaterial({ map: gradientTex(256, 256, [[0,'rgba(0,234,255,0.95)'],[0.55,'rgba(122,61,255,0.9)'],[1,'rgba(60,10,120,0)']]), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
            torso.add(new THREE.Mesh(bGeo, bellyMat));

            const shMat = new THREE.MeshStandardMaterial({ color: COL.bodyMid, roughness: 0.5, metalness: 0.3 });
            const shL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 24), shMat); shL.position.set(-0.55, 0.55, 0.05); torso.add(shL);
            const shR = shL.clone(); shR.position.set(0.55, 0.55, 0.05); torso.add(shR);

            const ground = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex(256,'rgba(0,234,255,0.8)','rgba(0,234,255,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
            ground.scale.set(2.6, 1.2, 1); mascot.add(ground);

            // Head
            head.add(new THREE.Mesh(rBox(1.35,1.08,0.9,0.26), new THREE.MeshStandardMaterial({ color:0x101321, roughness:0.35, metalness:0.45, emissive:new THREE.Color(0x000a14), emissiveIntensity:0.4 })));
            const bezel = new THREE.Mesh(rPlane(1.08,0.85,0.14), new THREE.MeshStandardMaterial({ color:0x1a2030, roughness:0.3, metalness:0.6, emissive:new THREE.Color(0x001525), emissiveIntensity:0.5 }));
            bezel.position.z = 0.455; head.add(bezel);
            const screen = new THREE.Mesh(rPlane(1,0.78,0.12), new THREE.MeshStandardMaterial({ color:0x03050d, roughness:0.15, emissive:new THREE.Color(0x03080f), emissiveIntensity:1 }));
            screen.position.z = 0.47; head.add(screen);
            const mxTex = matrixTex(256,192);
            const mxMat = new THREE.MeshBasicMaterial({ map:mxTex, transparent:true, opacity:0.55 });
            const mxPlane = new THREE.Mesh(rPlane(0.98,0.76,0.11), mxMat); mxPlane.position.z = 0.475; head.add(mxPlane);

            function makeEye() {
                const root = new THREE.Group();
                const mat = new THREE.MeshStandardMaterial({ color:COL.hot, emissive:new THREE.Color(COL.accent), emissiveIntensity:3, roughness:0.25 });
                const d = new THREE.Mesh(new THREE.OctahedronGeometry(0.15,0), mat);
                d.geometry.scale(1,1,0.35); d.rotation.z = Math.PI/4; d.userData.mat = mat; root.add(d);
                const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map:radialTex(128,'rgba(0,234,255,0.9)','rgba(0,234,255,0)'), transparent:true, blending:THREE.AdditiveBlending, depthWrite:false }));
                spr.scale.setScalar(0.75); spr.position.z = 0.02; root.add(spr);
                return { root, diamond: d, mat };
            }
            const eyeL = makeEye(), eyeR = makeEye();
            eyeL.root.position.set(-0.22, 0.02, 0.485); eyeR.root.position.set(0.22, 0.02, 0.485);
            head.add(eyeL.root, eyeR.root);
            const eyeHomeL = eyeL.root.position.clone(), eyeHomeR = eyeR.root.position.clone();

            // Confusion stars
            const confGroup = new THREE.Group(); confGroup.visible = false; head.add(confGroup);
            const starMat = new THREE.MeshBasicMaterial({ color: COL.accent, transparent: true, opacity: 0.9 });
            for (let i = 0; i < 4; i++) {
                const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), starMat.clone());
                confGroup.add(star);
            }

            // Antennae
            const antMat = new THREE.MeshStandardMaterial({ color:COL.accent, emissive:COL.accent, emissiveIntensity:0.8, roughness:0.3, metalness:0.4 });
            function makeAnt(side: number) {
                const g = new THREE.Group();
                const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,0.3,14), antMat); stem.position.y=0.15; stem.rotation.z=side*0.35;
                const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1,18,18), antMat); tip.position.set(side*0.12,0.32,0);
                g.add(stem,tip); return g;
            }
            const antL = makeAnt(-1); antL.position.set(-0.55,0.55,0); head.add(antL);
            const antR = makeAnt(1); antR.position.set(0.55,0.55,0); head.add(antR);
            const asLX=new Spr(0,2.2,0.6),asLZ=new Spr(0,2.5,0.55),asRX=new Spr(0,2.2,0.6),asRZ=new Spr(0,2.5,0.55);
            let pYaw=0,pPitch=0;

            // Limbs
            const limbMat = new THREE.MeshStandardMaterial({ color:COL.bodyDark, roughness:0.5, metalness:0.2, emissive:new THREE.Color(0x00070f), emissiveIntensity:0.4 });
            function makeArm(side: number) {
                const sh = new THREE.Group(); sh.position.set(side*0.55,0.55,0.08); torso.add(sh);
                const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.085,0.32,8,14),limbMat); upper.position.y=-0.16; sh.add(upper);
                const el = new THREE.Group(); el.position.y=-0.32; sh.add(el);
                const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.075,0.28,8,14),limbMat); lower.position.y=-0.14; el.add(lower);
                const hand = new THREE.Mesh(new THREE.SphereGeometry(0.11,20,20),limbMat); hand.position.y=-0.28; el.add(hand);
                return { sh, el };
            }
            const armL=makeArm(-1), armR=makeArm(1);

            function makeLeg(side: number) {
                const hip = new THREE.Group(); hip.position.set(side*0.2,-0.05,0); pelvis.add(hip);
                hip.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.11,0.32,8,16),limbMat));
                const kn = new THREE.Group(); kn.position.y=-0.32; hip.add(kn);
                kn.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.095,0.30,8,16),limbMat));
                const ank = new THREE.Group(); ank.position.y=-0.30; kn.add(ank);
                const fg=new THREE.SphereGeometry(0.17,24,24); fg.scale(1,0.5,1.55);
                ank.add(new THREE.Mesh(fg, new THREE.MeshStandardMaterial({color:0x0a0c14,roughness:0.5,metalness:0.25})));
                const sole = new THREE.Sprite(new THREE.SpriteMaterial({ map:radialTex(128,'rgba(0,234,255,0.8)','rgba(0,234,255,0)'), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending }));
                sole.scale.set(0.7,0.35,1); sole.position.y=-0.46; ank.add(sole);
                return { hip, kn, ank, sole };
            }
            const legL=makeLeg(-1), legR=makeLeg(1);

            // Geometry helpers
            function rBox(w:number,h:number,d:number,r:number) {
                const g=new THREE.BoxGeometry(w,h,d,6,6,6), pos=g.attributes.position, v=new THREE.Vector3();
                for(let i=0;i<pos.count;i++){
                    v.fromBufferAttribute(pos,i);
                    const cx=THREE.MathUtils.clamp(v.x,-w/2+r,w/2-r),cy=THREE.MathUtils.clamp(v.y,-h/2+r,h/2-r),cz=THREE.MathUtils.clamp(v.z,-d/2+r,d/2-r);
                    const dx=v.x-cx,dy=v.y-cy,dz2=v.z-cz,l=Math.sqrt(dx*dx+dy*dy+dz2*dz2);
                    if(l>0){v.set(cx+dx/l*r,cy+dy/l*r,cz+dz2/l*r);pos.setXYZ(i,v.x,v.y,v.z);}
                } g.computeVertexNormals(); return g;
            }
            function rPlane(w:number,h:number,r:number) {
                const s=new THREE.Shape(),hw=w/2,hh=h/2;
                s.moveTo(-hw+r,-hh);s.lineTo(hw-r,-hh);s.quadraticCurveTo(hw,-hh,hw,-hh+r);
                s.lineTo(hw,hh-r);s.quadraticCurveTo(hw,hh,hw-r,hh);
                s.lineTo(-hw+r,hh);s.quadraticCurveTo(-hw,hh,-hw,hh-r);
                s.lineTo(-hw,-hh+r);s.quadraticCurveTo(-hw,-hh,-hw+r,-hh);
                return new THREE.ShapeGeometry(s,16);
            }
            function radialTex(size:number,inner:string,outer:string) {
                const c=document.createElement('canvas');c.width=c.height=size;
                const ctx=c.getContext('2d')!,g=ctx.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
                g.addColorStop(0,inner);g.addColorStop(1,outer);ctx.fillStyle=g;ctx.fillRect(0,0,size,size);
                return new THREE.CanvasTexture(c);
            }
            function gradientTex(w:number,h:number,stops:any[]) {
                const c=document.createElement('canvas');c.width=w;c.height=h;
                const ctx=c.getContext('2d')!,g=ctx.createRadialGradient(w/2,h*0.15,0,w/2,h*0.5,h*0.9);
                stops.forEach(s=>g.addColorStop(s[0],s[1]));ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
                return new THREE.CanvasTexture(c);
            }
            function matrixTex(w:number,h:number) {
                const c=document.createElement('canvas');c.width=w;c.height=h;
                const ctx=c.getContext('2d')!;ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);ctx.font='10px monospace';
                for(let i=0;i<480;i++){const a=Math.random()*0.55+0.1,g=200+(Math.random()*55|0);ctx.fillStyle=`rgba(0,${g},${g},${a})`;ctx.fillText(String.fromCharCode(33+Math.floor(Math.random()*90)),Math.random()*w,Math.random()*h);}
                const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
            }

            // ── Agent ──
            const WALK='walk',CLIMB='climb',PEEK='peek',IDLE='idle',FALL='fall',CONFUSED='confused';
            const a = {
                state: WALK as string, stateTime: 0,
                pos: new THREE.Vector2(0,0), facing: 1,
                velY: 0,
                targetX: 0,
                climbSide: 1, climbTargetY: 0, climbDir: 1,
                peekSide: 1, peekPhase: 0, walkPhase: 0,
                sx: new Spr(0,0.4,1), sy: new Spr(0,0.5,1),
                sTiltZ: new Spr(0,1,1), sTurn: new Spr(0,0.8,1),
                sBob: new Spr(0,2.5,1), sSquash: new Spr(0,3,1),
                wasInDrag: false,
                dragVelX: 0,   // smoothed drag velocity X for inertia
                dragVelY: 0,   // smoothed drag velocity Y for inertia
                stretchY: new Spr(1,5,0.65), 
                stretchX: new Spr(1,5,0.65),
            };

            const mouse = { x:0, y:0, has:false };
            const onMM = (e:MouseEvent) => {
                const u=110; mouse.x=(e.clientX/window.innerWidth-0.5)*(window.innerWidth/u); mouse.y=-(e.clientY/window.innerHeight-0.5)*(window.innerHeight/u); mouse.has=true;
            };
            window.addEventListener('mousemove',onMM);

            function enterWalk() { a.state=WALK; a.stateTime=0; a.targetX=THREE.MathUtils.randFloat(view.left+1.2,view.right-1.2); }
            function enterClimb() {
                a.state=CLIMB; a.stateTime=0; a.climbSide=Math.random()<.5?-1:1;
                a.sx.tgt=a.climbSide*(Math.abs(view.right)-0.8); a.climbDir=1;
                a.climbTargetY=THREE.MathUtils.randFloat(1.4,Math.abs(view.top)-1.2); a.facing=a.climbSide;
            }
            function enterPeek() {
                a.state=PEEK; a.stateTime=0; a.peekSide=Math.random()<.5?-1:1; a.peekPhase=0;
                const ay=THREE.MathUtils.randFloat(0.5,Math.abs(view.top)-1.2);
                a.sx.set(a.peekSide*(Math.abs(view.right)+1)); a.sy.set(ay); a.pos.y=ay; a.facing=-a.peekSide;
            }
            function pickNext() {
                const r=Math.random();
                if(r<0.45)enterWalk();else if(r<0.75)enterClimb();else if(r<0.92)enterPeek();
                else{a.state=IDLE;a.stateTime=0;}
            }
            a.sx.set(0);a.sy.set(0);enterWalk();

            const damp=(cur:number,tgt:number,rate:number,dt:number)=>cur+(tgt-cur)*(1-Math.exp(-rate*dt));

            // Hit-area update
            let fc=0;
            function updateHit() {
                const w=window.innerWidth,h=window.innerHeight;
                const ndcX=(mascot.position.x-view.left)/(view.right-view.left)*2-1;
                const ndcY=(mascot.position.y-view.bottom)/(view.top-view.bottom)*2-1;
                const sx=(ndcX+1)/2*w, sy=(1-(ndcY+1)/2)*h;
                const pu=w/(view.right-view.left);
                const hw=mascot.scale.x*1.6*pu, hh=mascot.scale.y*2.8*pu;
                setHitArea({x:sx-hw,y:sy-hh,w:hw*2,h:hh*2});
            }

            const clock=new THREE.Clock();
            let elapsed=0;
            const _v=new THREE.Vector3();

            function animate() {
                const dt=Math.min(clock.getDelta(),0.05);
                elapsed+=dt; a.stateTime+=dt;
                const floorY=view.bottom+0.15;

                // ── Detect drag state from shared `drag` object ──
                if(drag.active) {
                    if(!a.wasInDrag) { a.wasInDrag=true; confGroup.visible=false; a.dragVelX=0; a.dragVelY=0; }
                    a.state='drag';

                    // Smooth position follows pointer with slight spring lag (feels like grabbed scruff)
                    const lerpRate = 1 - Math.exp(-22 * dt);
                    mascot.position.x += (drag.worldX - mascot.position.x) * lerpRate;
                    mascot.position.y += (drag.worldY - mascot.position.y) * lerpRate;
                    a.sx.set(mascot.position.x);
                    a.sy.set(mascot.position.y - floorY);
                    a.pos.y = mascot.position.y;

                    // Track smoothed drag velocity for inertia
                    const rawVX = (drag.worldX - (mascot.position.x - (drag.worldX - mascot.position.x))) / Math.max(dt, 0.01);
                    const rawVY = drag.velY;
                    a.dragVelX = a.dragVelX + (rawVX - a.dragVelX) * (1 - Math.exp(-12 * dt));
                    a.dragVelY = a.dragVelY + (rawVY - a.dragVelY) * (1 - Math.exp(-12 * dt));

                    const speed = Math.sqrt(a.dragVelX*a.dragVelX + a.dragVelY*a.dragVelY);
                    const maxSpd = 8;

                    // No torso stretching — keep normal scale
                    torso.scale.set(1, 1, 1);
                    pelvis.position.y = 0.62;

                    // Body tilts in direction of motion (lean into the dart)
                    const tiltZ = THREE.MathUtils.clamp(-a.dragVelX / maxSpd * 0.55, -0.55, 0.55);
                    const tiltX = THREE.MathUtils.clamp(-a.dragVelY / maxSpd * 0.35, -0.35, 0.35);
                    body.rotation.z = damp(body.rotation.z, tiltZ, 12, dt);
                    body.rotation.x = damp(body.rotation.x, tiltX, 12, dt);
                    body.rotation.y = 0;
                    body.position.y = 0;

                    // Head leans forward into movement direction
                    neck.rotation.y = damp(neck.rotation.y, THREE.MathUtils.clamp(a.dragVelX / maxSpd * 0.4, -0.4, 0.4), 10, dt);
                    neck.rotation.x = damp(neck.rotation.x, THREE.MathUtils.clamp(a.dragVelY / maxSpd * 0.25, -0.25, 0.25), 10, dt);

                    // Legs trail behind movement (opposite to velocity)
                    const legTrail = THREE.MathUtils.clamp(a.dragVelY / maxSpd * 0.7, -0.7, 0.7);
                    const legSwing = Math.sin(elapsed * 8) * 0.18 * Math.min(speed / 2, 1);
                    legL.hip.rotation.x = damp(legL.hip.rotation.x, legTrail + legSwing, 10, dt);
                    legR.hip.rotation.x = damp(legR.hip.rotation.x, legTrail - legSwing, 10, dt);
                    legL.kn.rotation.x = damp(legL.kn.rotation.x, -Math.abs(legTrail) * 0.6 - 0.2, 10, dt);
                    legR.kn.rotation.x = damp(legR.kn.rotation.x, -Math.abs(legTrail) * 0.6 - 0.2, 10, dt);

                    // Arms spread out for balance, trail opposite to X motion
                    const armTrailX = THREE.MathUtils.clamp(-a.dragVelX / maxSpd * 0.5, -0.5, 0.5);
                    const armSpread = 0.55 + Math.min(speed / maxSpd, 1) * 0.35;
                    armL.sh.rotation.x = damp(armL.sh.rotation.x, -armSpread + armTrailX, 10, dt);
                    armR.sh.rotation.x = damp(armR.sh.rotation.x, -armSpread - armTrailX, 10, dt);
                    armL.sh.rotation.z = damp(armL.sh.rotation.z, 0.65 + Math.sin(elapsed*6)*0.1, 10, dt);
                    armR.sh.rotation.z = damp(armR.sh.rotation.z, -0.65 - Math.sin(elapsed*6)*0.1, 10, dt);
                    armL.el.rotation.x = damp(armL.el.rotation.x, 0.3, 10, dt);
                    armR.el.rotation.x = damp(armR.el.rotation.x, 0.3, 10, dt);

                    // Eyes wide open in direction of travel
                    const eyeShiftX = THREE.MathUtils.clamp(a.dragVelX / maxSpd * 0.15, -0.15, 0.15);
                    eyeL.root.position.lerp(new THREE.Vector3(eyeHomeL.x + eyeShiftX, eyeHomeL.y + 0.04, eyeHomeL.z), 1 - Math.exp(-12*dt));
                    eyeR.root.position.lerp(new THREE.Vector3(eyeHomeR.x + eyeShiftX, eyeHomeR.y + 0.04, eyeHomeR.z), 1 - Math.exp(-12*dt));
                    eyeL.diamond.scale.y = eyeR.diamond.scale.y = 1.1; // wide
                    eyeL.mat.emissiveIntensity = 4 + Math.sin(elapsed * 10) * 1;
                    eyeR.mat.emissiveIntensity = 4 + Math.sin(elapsed * 10 + 1) * 1;

                } else {
                    // Drag just ended — launch into FALL if meaningfully above floor
                    if(a.wasInDrag) {
                        a.wasInDrag = false;
                        // Reset body orientation
                        body.rotation.x = 0;
                        if(mascot.position.y > floorY + 0.6) {
                            a.state = FALL;
                            a.velY = Math.min(drag.velY, 3);
                            a.stateTime = 0;
                            a.pos.set(mascot.position.x, mascot.position.y);
                            a.sx.set(mascot.position.x);
                        } else {
                            a.pos.y = 0; a.sy.set(0);
                            enterWalk();
                        }
                        torso.scale.set(1, 1, 1);
                        pelvis.position.y = 0.62;
                    }

                    // ── FALL ──
                    if(a.state===FALL) {
                        const GRAVITY=-16;
                        a.velY += GRAVITY*dt;
                        a.pos.y += a.velY*dt;
                        mascot.position.x=a.sx.step(dt);
                        mascot.position.y=a.pos.y;

                        if(a.pos.y<=floorY){
                            a.pos.y=floorY; a.velY=0;
                            a.state=CONFUSED; a.stateTime=0;
                            a.sx.set(mascot.position.x); a.sy.set(0);
                        }

                        // Squash on Y while airborne
                        const fv=THREE.MathUtils.clamp(1-Math.abs(a.velY)*0.05,0.5,1.1);
                        torso.scale.set(1/fv,fv,1/fv);
                        body.rotation.y=0; body.rotation.z=0; body.position.y=0;

                        // Legs fly up
                        legL.hip.rotation.x=damp(legL.hip.rotation.x,-0.8,10,dt);
                        legR.hip.rotation.x=damp(legR.hip.rotation.x,-0.8,10,dt);
                        legL.kn.rotation.x=damp(legL.kn.rotation.x,-0.5,10,dt);
                        legR.kn.rotation.x=damp(legR.kn.rotation.x,-0.5,10,dt);
                        armL.sh.rotation.x=damp(armL.sh.rotation.x,-1.5,10,dt);
                        armR.sh.rotation.x=damp(armR.sh.rotation.x,-1.5,10,dt);

                    // ── CONFUSED ──
                    } else if(a.state===CONFUSED) {
                        mascot.position.x=a.sx.step(dt);
                        mascot.position.y=floorY;

                        // Bounce squash on impact (first 0.2s)
                        const stamp=Math.min(a.stateTime/0.18,1);
                        const sq=1-0.55*Math.sin(stamp*Math.PI);
                        a.stretchY.tgt=sq; a.stretchX.tgt=1/Math.sqrt(Math.max(sq,0.1));
                        a.stretchY.step(dt); a.stretchX.step(dt);
                        torso.scale.set(a.stretchX.v,a.stretchY.v,a.stretchX.v);
                        pelvis.position.y=damp(pelvis.position.y,0.62,8,dt);

                        body.rotation.y=0;
                        body.rotation.z=Math.sin(elapsed*2.5)*0.04;
                        body.position.y=0;

                        // Dizzy head spin
                        head.rotation.z=Math.sin(elapsed*12)*0.22*Math.max(0,1-(a.stateTime/3));

                        // Spinning confusion stars
                        confGroup.visible=true;
                        confGroup.children.forEach((star,i)=>{
                            const ang=elapsed*5+(i/confGroup.children.length)*Math.PI*2;
                            const r2=0.6+Math.sin(elapsed*3+i)*0.1;
                            star.position.set(Math.cos(ang)*r2,0.85+Math.sin(ang*2)*0.15,Math.sin(ang)*0.15);
                            star.rotation.x=elapsed*8; star.rotation.z=elapsed*6;
                        });

                        // Dazed semi-random eye wander
                        eyeL.root.position.x=eyeHomeL.x+Math.sin(elapsed*7)*0.08;
                        eyeR.root.position.x=eyeHomeR.x+Math.sin(elapsed*7+Math.PI)*0.08;
                        eyeL.root.position.y=eyeHomeL.y+Math.cos(elapsed*5)*0.05;
                        eyeR.root.position.y=eyeHomeR.y+Math.cos(elapsed*5+1)*0.05;
                        eyeL.diamond.scale.y=eyeR.diamond.scale.y=0.6+Math.sin(elapsed*9)*0.3;
                        eyeL.mat.emissiveIntensity=eyeR.mat.emissiveIntensity=2;

                        if(a.stateTime>3.0){
                            confGroup.visible=false;
                            head.rotation.z=0;
                            eyeL.root.position.copy(eyeHomeL); eyeR.root.position.copy(eyeHomeR);
                            enterWalk();
                        }

                    // ── NORMAL AI states ──
                    } else {
                        confGroup.visible=false;
                        a.stretchY.tgt=1; a.stretchX.tgt=1;
                        a.stretchY.step(dt); a.stretchX.step(dt);
                        pelvis.position.y=damp(pelvis.position.y,0.62,8,dt);

                        if(a.state===WALK){
                            a.sx.tgt=a.targetX; a.sy.tgt=0;
                            const dir=Math.sign(a.targetX-a.sx.v);
                            if(Math.abs(a.targetX-a.sx.v)>0.04)a.facing=dir;
                            a.sTurn.tgt=a.facing>0?0.35:-0.35; a.sTiltZ.tgt=-a.facing*0.04;
                            if(Math.abs(a.sx.v-a.targetX)<0.05&&Math.abs(a.sx.vel)<0.15)pickNext();
                        } else if(a.state===CLIMB){
                            a.sx.tgt=a.climbSide*(Math.abs(view.right)-0.75);
                            a.pos.y+=0.12*dt*a.climbDir; a.sy.tgt=a.pos.y;
                            if(a.climbDir>0&&a.pos.y>=a.climbTargetY){a.climbDir=-1;a.stateTime=0;}
                            if(a.climbDir<0&&a.pos.y<=0.02){a.pos.y=0;enterWalk();}
                            a.sTiltZ.tgt=a.climbSide*0.12; a.sTurn.tgt=a.climbSide*1.35;
                        } else if(a.state===PEEK){
                            if(a.peekPhase===0){a.sx.tgt=a.peekSide*(Math.abs(view.right)-0.85);if(a.stateTime>0.9){a.peekPhase=1;a.stateTime=0;}}
                            else if(a.peekPhase===1){if(a.stateTime>2.4){a.peekPhase=2;a.stateTime=0;}}
                            else{a.sx.tgt=a.peekSide*(Math.abs(view.right)+1);if(a.stateTime>0.9){a.pos.y=0;a.sy.set(0);a.sx.set(THREE.MathUtils.clamp(a.sx.v,view.left+1,view.right-1));enterWalk();}}
                            a.sTurn.tgt=-a.peekSide*0.4; a.sTiltZ.tgt=0;
                        } else if(a.state===IDLE){
                            a.sTurn.tgt=Math.sin(elapsed*0.9)*0.3; a.sTiltZ.tgt=0;
                            if(a.stateTime>2.2)pickNext();
                        }

                        a.sx.step(dt);a.sy.step(dt);a.sTiltZ.step(dt);a.sTurn.step(dt);
                        mascot.position.x=a.sx.v; mascot.position.y=floorY+a.sy.v;
                        body.rotation.y=a.sTurn.v; body.rotation.z=a.sTiltZ.v;

                        // Walk cycle
                        const W=a.state===WALK,C=a.state===CLIMB;
                        a.walkPhase+=dt*(W?(a.sx.vel||0.5)*4.6:C?3.8:1.6);
                        const bob=(Math.abs(Math.sin(a.walkPhase)))*(W?0.07:C?0.04:0.02)-(W?0.035:C?0.02:0.01);
                        a.sBob.tgt=bob; a.sBob.step(dt); body.position.y=a.sBob.v;
                        const imp=Math.max(0,Math.sin(a.walkPhase))*(W?0.08:0);
                        a.sSquash.tgt=imp; a.sSquash.step(dt);
                        torso.scale.set(a.stretchX.v*(1+imp*0.5),a.stretchY.v*(1-imp*0.7),a.stretchX.v*(1+imp*0.3));

                        // Legs
                        const lr=W||C?14:8;
                        const lp=a.walkPhase,rp=lp+Math.PI;
                        const legT=(ph:number)=>({h:Math.sin(ph)*(W?0.55:C?0.4:0),k:-Math.max(0,Math.sin(ph))*(W?0.9:C?0.8:0),y:-0.05+Math.max(0,Math.sin(ph))*0.04});
                        const lt=legT(lp),rt=legT(rp);
                        legL.hip.rotation.x=damp(legL.hip.rotation.x,lt.h,lr,dt);legR.hip.rotation.x=damp(legR.hip.rotation.x,rt.h,lr,dt);
                        legL.kn.rotation.x=damp(legL.kn.rotation.x,lt.k,lr,dt);legR.kn.rotation.x=damp(legR.kn.rotation.x,rt.k,lr,dt);
                        legL.hip.position.y=damp(legL.hip.position.y,lt.y,lr,dt);legR.hip.position.y=damp(legR.hip.position.y,rt.y,lr,dt);
                        const sOn=a.state!==PEEK&&a.pos.y<0.3?1:0;
                        legL.sole.material.opacity=damp(legL.sole.material.opacity,sOn,6,dt);
                        legR.sole.material.opacity=damp(legR.sole.material.opacity,sOn,6,dt);

                        // Arms
                        const sw=Math.sin(a.walkPhase),ar=W||C?12:6;
                        armL.sh.rotation.x=damp(armL.sh.rotation.x,W?-sw*0.55:C?-2+sw*0.4:0,ar,dt);
                        armR.sh.rotation.x=damp(armR.sh.rotation.x,W?sw*0.55:C?-2-sw*0.4:0,ar,dt);
                        armL.sh.rotation.z=damp(armL.sh.rotation.z,C?0.4:0.12,ar,dt);
                        armR.sh.rotation.z=damp(armR.sh.rotation.z,C?-0.4:-0.12,ar,dt);
                        armL.el.rotation.x=damp(armL.el.rotation.x,W?0.15+Math.max(0,-sw)*0.4:0.25,ar,dt);
                        armR.el.rotation.x=damp(armR.el.rotation.x,W?0.15+Math.max(0,sw)*0.4:0.25,ar,dt);

                        // Head gaze
                        const gz=mouse.has?new THREE.Vector3(mouse.x,mouse.y,0):new THREE.Vector3(mascot.position.x+a.facing,mascot.position.y+1.5,0);
                        const hw2=new THREE.Vector3(); head.getWorldPosition(hw2);
                        const tg=_v.copy(gz).sub(hw2);
                        neck.rotation.y=damp(neck.rotation.y,THREE.MathUtils.clamp(Math.atan2(tg.x,1.5),-0.55,0.55)-body.rotation.y,6,dt);
                        neck.rotation.x=damp(neck.rotation.x,THREE.MathUtils.clamp(-Math.atan2(tg.y,1.5),-0.35,0.35),6,dt);
                        const gx=THREE.MathUtils.clamp(_v.copy(gz).sub(hw2).x/2,-1,1),gy=THREE.MathUtils.clamp(_v.y/2,-1,1);
                        eyeL.root.position.lerp(new THREE.Vector3(eyeHomeL.x+gx*0.11,eyeHomeL.y+gy*0.07,eyeHomeL.z),1-Math.exp(-10*dt));
                        eyeR.root.position.lerp(new THREE.Vector3(eyeHomeR.x+gx*0.11,eyeHomeR.y+gy*0.07,eyeHomeR.z),1-Math.exp(-10*dt));
                        const pulse=2.6+Math.sin(elapsed*2.2)*0.55;
                        eyeL.mat.emissiveIntensity=pulse; eyeR.mat.emissiveIntensity=pulse;
                        const blT=elapsed%4;
                        const bl=blT>3.82?1-Math.abs(Math.sin((blT-3.82)/0.18*Math.PI)):1;
                        eyeL.diamond.scale.y=eyeR.diamond.scale.y=Math.max(0.08,bl);

                        // Antennae
                        const yv=(neck.rotation.y-pYaw)/Math.max(dt,0.0001),pv=(neck.rotation.x-pPitch)/Math.max(dt,0.0001);
                        pYaw=neck.rotation.y; pPitch=neck.rotation.x;
                        asLX.vel+=pv*0.9; asRX.vel+=pv*0.9; asLZ.vel+=yv*0.7; asRZ.vel+=-yv*0.7;
                        asLX.step(dt);asRX.step(dt);asLZ.step(dt);asRZ.step(dt);
                        antL.rotation.x=asLX.v*0.7; antR.rotation.x=asRX.v*0.7;
                        antL.rotation.z=asLZ.v*0.8+Math.sin(elapsed*2.4)*0.05;
                        antR.rotation.z=asRZ.v*0.8+Math.sin(elapsed*2.4+0.6)*-0.05;
                    }
                }

                // Always-on effects
                if(mxMat.map){mxMat.map.offset.y=(elapsed*0.14)%1; mxMat.map.offset.x=Math.sin(elapsed*0.3)*0.02;}
                bellyMat.opacity=0.8+Math.sin(elapsed*1.4)*0.15;
                const gOn=(a.pos.y<0.1&&!drag.active&&a.state!==PEEK)?1:0;
                ground.material.opacity=damp(ground.material.opacity,(0.55+Math.sin(elapsed*1.4+0.5)*0.22)*gOn,5,dt);
                ground.position.y=0.1;

                renderer.render(scene,cam);
                fc++; if(fc%6===0)updateHit();
                reqId=requestAnimationFrame(animate);
            }
            animate();

            const onRes=()=>{
                renderer.setSize(window.innerWidth,window.innerHeight);
                view=computeView();
                cam.left=view.left;cam.right=view.right;cam.top=view.top;cam.bottom=view.bottom;
                cam.updateProjectionMatrix();
            };
            window.addEventListener('resize',onRes);

            return ()=>{
                cancelAnimationFrame(reqId);
                renderer.dispose();
                window.removeEventListener('resize',onRes);
                window.removeEventListener('mousemove',onMM);
            };
        };

        try { return init(); } catch(e){console.error('Mascot init failed',e);}
    },[]);

    const handlePointerDown=(e:React.PointerEvent)=>{
        if(chatOpenRef.current) return;
        e.preventDefault(); e.stopPropagation();
        const u=110;
        const wx=(e.clientX/window.innerWidth-0.5)*(window.innerWidth/u);
        const wy=-(e.clientY/window.innerHeight-0.5)*(window.innerHeight/u);
        drag.active=true; drag.worldX=wx; drag.worldY=wy;
        drag.startWorldY=wy; drag.velY=0; drag.prevY=wy; drag.prevT=performance.now()/1000;
        setIsDragging(true);
    };

    return (
        <>
            <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-[9000]" style={{pointerEvents:'none'}}/>

            {!chatOpen && (
                <div
                    onPointerDown={handlePointerDown}
                    onClick={()=>{ if(!isDragging) setChatOpen(true); }}
                    title="Grab and throw me! Or click to chat 😄"
                    style={{
                        position:'fixed', left:hitArea.x, top:hitArea.y,
                        width:hitArea.w, height:hitArea.h,
                        cursor: isDragging ? 'grabbing' : 'grab',
                        zIndex:9001, touchAction:'none', borderRadius:'50%',
                    }}
                />
            )}

            <AnimatePresence>
                {chatOpen&&(
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 40 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed',
                            bottom: '1.5rem',
                            right: '1.5rem',
                            width: 380,
                            height: 'min(660px, 85vh)',
                            zIndex: 99999,
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: '1.5rem',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
                            background: '#0a0a0c',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            flexShrink: 0,
                            background: 'linear-gradient(180deg, #16161c 0%, #0d0d12 100%)',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            padding: '1rem 1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            position: 'relative'
                        }}>
                            {/* Avatar */}
                            <div style={{
                                width: 42, height: 42,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(198,244,50,0.1), rgba(100,220,255,0.1))',
                                border: '1.5px solid rgba(198,244,50,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                                position: 'relative',
                            }}>
                                <Bot size={20} style={{ color: '#C6F432' }} />
                                <span style={{
                                    position: 'absolute', bottom: 1, right: 1,
                                    width: 10, height: 10, borderRadius: '50%',
                                    background: '#C6F432',
                                    border: '2px solid #0d0d12',
                                    boxShadow: '0 0 8px rgba(198,244,50,0.6)'
                                }} />
                            </div>
                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', lineHeight: 1.2 }}>Redber AI</div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    EXPERT ASSISTANT FOR ACENZOS
                                </div>
                            </div>
                            {/* Close */}
                            <button
                                onClick={() => setChatOpen(false)}
                                style={{
                                    flexShrink: 0,
                                    width: 32, height: 32,
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'rgba(255,255,255,0.6)',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s',
                                }}
                                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                            >
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div style={{
                            flex: 1,
                            minHeight: 0,
                            overflowY: 'auto',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                        }}>
                            {messages.map((m, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    key={i}
                                    style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start', width: '100%' }}
                                >
                                    {m.sender === 'bot' && (
                                        <div style={{
                                            width: 28, height: 28, borderRadius: '50%',
                                            background: 'rgba(198,244,50,0.1)',
                                            border: '1px solid rgba(198,244,50,0.2)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0, marginRight: 8, alignSelf: 'flex-end',
                                        }}>
                                            <Bot size={14} style={{ color: '#C6F432' }} />
                                        </div>
                                    )}
                                    <div style={{
                                        maxWidth: m.sender === 'bot' ? '80%' : '85%',
                                        padding: '0.85rem 1rem',
                                        borderRadius: m.sender === 'user' ? '1.2rem 1.2rem 0.25rem 1.2rem' : '1.2rem 1.2rem 1.2rem 0.25rem',
                                        background: m.sender === 'user'
                                            ? '#C6F432'
                                            : 'rgba(255,255,255,0.05)',
                                        border: m.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                        color: m.sender === 'user' ? '#0d0d0d' : '#e0e0e0',
                                        fontSize: '0.9rem',
                                        lineHeight: 1.5,
                                        wordBreak: 'break-word',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    }}>
                                        {m.sender === 'user'
                                            ? <p style={{ margin: 0, fontWeight: 600 }}>{m.text}</p>
                                            : <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}><ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{m.text}</ReactMarkdown></div>
                                        }
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 8, width: '100%' }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: 'rgba(198,244,50,0.1)',
                                        border: '1px solid rgba(198,244,50,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                        <Bot size={14} style={{ color: '#C6F432' }} />
                                    </div>
                                    <div style={{
                                        padding: '0.85rem 1rem',
                                        borderRadius: '1.2rem 1.2rem 1.2rem 0.25rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        display: 'flex', gap: 4, alignItems: 'center',
                                    }}>
                                        {[0, 0.15, 0.3].map(d => (
                                            <motion.div key={d} animate={{ y: [0, -4, 0], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, delay: d }}
                                                style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }} />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div style={{
                            flexShrink: 0,
                            padding: '1rem',
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                            background: '#0a0a0c',
                        }}>
                            <form
                                onSubmit={e => { e.preventDefault(); sendMessage(); }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 999,
                                    padding: '0.4rem 0.4rem 0.4rem 1rem',
                                    transition: 'all 0.2s',
                                }}
                                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(198,244,50,0.4)')}
                                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                            >
                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="Ask me anything..."
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        background: 'transparent',
                                        border: 'none',
                                        outline: 'none',
                                        color: '#fff',
                                        fontSize: '0.9rem',
                                        fontFamily: 'inherit',
                                        fontWeight: 500,
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    style={{
                                        flexShrink: 0,
                                        width: 36, height: 36,
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: input.trim() && !isLoading ? '#C6F432' : 'rgba(255,255,255,0.08)',
                                        color: input.trim() && !isLoading ? '#0d0d0d' : 'rgba(255,255,255,0.3)',
                                        cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        boxShadow: input.trim() && !isLoading ? '0 4px 12px rgba(198,244,50,0.2)' : 'none',
                                    }}
                                >
                                    <Send size={16} strokeWidth={2.5} style={{ marginLeft: 2, marginTop: 1 }} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
