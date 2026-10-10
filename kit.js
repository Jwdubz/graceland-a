/* Concept Starter Kit: the motion core shared by every SOTD concept (extracted from Starbase/Rainbow/Stirling/PF/Wrapstar).
   Motion is mandatory; one Pause/Play control (WCAG 2.2.2) owns every ambient loop and film.
   Hooks: video.film, [data-split], [data-reveal], [data-clip], .loader, .motion button, .hdr, window.KIT.ambient.push(tween) */
(function(){
  'use strict';
  var KIT = window.KIT = { ambient: [], paused: false, hooks: { intro: null, afterBoot: [] } };
  function boot(){
    var g = window.gsap, ST = window.ScrollTrigger, Split = window.SplitText;
    g.registerPlugin(ST, Split);
    var html = document.documentElement, pending = new Set(), splits = [];
    /* smooth scroll: Lenis lerp 0.1 */
    var lenis = KIT.lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
    lenis.on('scroll', ST.update); g.ticker.add(function(t){ lenis.raf(t*1000); }); g.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function(a){ a.addEventListener('click', function(e){
      var id=a.getAttribute('href'); if(id.length<2) return; var el=document.querySelector(id); if(!el) return;
      e.preventDefault(); lenis.scrollTo(el,{offset:id==='#top'?0:-70,duration:1.2,easing:function(x){return 1-Math.pow(1-x,4);}}); }); });
    /* films: muted loop playsinline (iOS autoplay); poster stays if the cut fails */
    var films = [].slice.call(document.querySelectorAll('video.film'));
    films.forEach(function(v){ v.muted=true; v.defaultMuted=true; v.setAttribute('muted',''); v.playsInline=true; v.setAttribute('playsinline','');
      var fail=function(){ v.classList.add('nofilm'); }; v.addEventListener('error',fail); var s=v.querySelector('source'); if(s) s.addEventListener('error',fail); });
    KIT.playFilms=function(){ films.forEach(function(v){ if(!v.classList.contains('nofilm')){ var p=v.play(); if(p&&p.catch)p.catch(function(){}); } }); };
    KIT.pauseFilms=function(){ films.forEach(function(v){ v.pause(); }); };
    /* word/line reveal: masked lines rise */
    function splitEl(el){ var s=Split.create(el,{type:'lines',mask:'lines',linesClass:'split-line',autoSplit:false});
      (s.masks||[]).forEach(function(m){ m.classList.add('split-mask'); }); g.set(s.lines,{yPercent:el._done?0:130}); el._split=s; el._lines=s.lines; }
    document.querySelectorAll('[data-split]').forEach(function(el){ splitEl(el); splits.push(el); });
    document.querySelectorAll('[data-reveal]').forEach(function(el){ g.set(el,{autoAlpha:0,y:26}); });
    function reveal(el){ if(el._done) return; el._done=true; pending.delete(el);
      if(el._lines) g.to(el._lines,{yPercent:0,duration:.55,ease:'power3.out',stagger:.04,overwrite:true}); else g.to(el,{autoAlpha:1,y:0,duration:.5,ease:'power2.out',overwrite:true}); }
    KIT.reveal=reveal;
    function finishAll(){ pending.forEach(function(el){ el._done=true; if(el._lines) g.set(el._lines,{yPercent:0}); else g.set(el,{autoAlpha:1,y:0}); }); pending.clear(); }
    /* loader -> intro (override with KIT.hooks.intro(g, ctx) returning a timeline) */
    var hero=document.querySelector('.hero'), loader=document.querySelector('.loader');
    var heroLines=hero?[].slice.call(hero.querySelectorAll('[data-split]')):[];
    var intro = KIT.hooks.intro ? KIT.hooks.intro(g,{hero:hero,loader:loader,heroLines:heroLines,reveal:reveal,lenis:lenis}) : (function(){
      var tl=g.timeline({delay:.15});
      if(loader) tl.to(loader,{clipPath:'inset(0 0 100% 0)',duration:1,ease:'expo.inOut'},.4);
      tl.add(function(){ heroLines.forEach(function(el){el._done=true;}); },.9)
        .to(heroLines.map(function(el){return el._lines;}).flat(),{yPercent:0,duration:.85,ease:'power3.out',stagger:.35},.9)
        .add(function(){ if(hero) hero.querySelectorAll('[data-reveal]').forEach(reveal); },1.6);
      if(loader) tl.set(loader,{display:'none'});
      return tl; })();
    lenis.stop(); window.scrollTo(0,0); intro.eventCallback('onStart',function(){}); 
    intro.add(function(){ lenis.start(); KIT.playFilms(); }, Math.min(1, intro.duration()));
    KIT.intro=window.__intro=intro;
    /* scroll reveals fire BEFORE entry (top 140%) + per-frame safety sweep: no text ever stays hidden */
    splits.concat([].slice.call(document.querySelectorAll('[data-reveal]'))).forEach(function(el){
      if(hero&&hero.contains(el)) return; pending.add(el);
      ST.create({trigger:el,start:'top 140%',once:true,onEnter:function(){reveal(el);}}); });
    g.ticker.add(function(){ if(!pending.size||intro.progress()<.6) return; var vh=innerHeight;
      pending.forEach(function(el){ if(el.getBoundingClientRect().top<vh*1.4) reveal(el); }); });
    /* clip-open media */
    document.querySelectorAll('[data-clip]').forEach(function(el){ g.fromTo(el,{clipPath:'inset(10% 8% 10% 8% round 1rem)'},{clipPath:'inset(0% 0% 0% 0% round 1rem)',ease:'none',scrollTrigger:{trigger:el,start:'top 100%',end:'top 35%',scrub:.5}}); });
    /* Pause / Play: one control */
    var btn=document.querySelector('.motion');
    if(btn){ var txt=btn.querySelector('.motion__txt'); btn.addEventListener('click',function(){
      KIT.paused=!KIT.paused; var p=KIT.paused; btn.setAttribute('aria-pressed',String(p)); btn.setAttribute('aria-label',p?'Play Motion':'Pause Motion');
      if(txt) txt.textContent=p?'Play':'Pause'; html.classList.toggle('is-paused',p);
      if(p){ if(intro.progress()<1) intro.progress(1); finishAll(); KIT.ambient.forEach(function(t){t.pause();}); KIT.pauseFilms(); }
      else { KIT.ambient.forEach(function(t){t.resume();}); KIT.playFilms(); } }); }
    /* header solid after hero */
    var hdr=document.querySelector('.hdr');
    if(hdr){ var solid=function(){ hdr.classList.toggle('hdr--solid',(window.scrollY||0)>60); }; lenis.on('scroll',solid); solid(); }
    /* re-split on width change (rotate/resize), not on iOS URL-bar height changes */
    var lastW=innerWidth, rt;
    addEventListener('resize',function(){ if(innerWidth===lastW) return; lastW=innerWidth; clearTimeout(rt); rt=setTimeout(function(){
      if(intro.progress()<1) intro.progress(1); splits.forEach(function(el){ if(el._split) el._split.revert(); }); splits.forEach(splitEl); ST.refresh(); },160); });
    addEventListener('load',function(){ ST.refresh(); });
    KIT.hooks.afterBoot.forEach(function(f){ f(g,ST,KIT); });
  }
  var go=function(){ boot(); };
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(go); else addEventListener('load',go);
})();
