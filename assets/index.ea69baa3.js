import{C as h,L as $,a as I,P as b,b as v,c as A,T,p as S}from"./vendor.5fcbef14.js";const P=function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))s(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const o of a.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function i(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerpolicy&&(a.referrerPolicy=r.referrerpolicy),r.crossorigin==="use-credentials"?a.credentials="include":r.crossorigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(r){if(r.ep)return;r.ep=!0;const a=i(r);fetch(r.href,a)}};P();const q=t=>typeof t.status=="number"&&typeof t.message=="string"&&typeof t.locations=="object"&&Array.isArray(t.locations)&&t.locations.every(e=>typeof e.line=="number"&&typeof e.column=="number"),m=t=>Math.floor(t.getTime()/1e3),u=async t=>{const e=await fetch("https://graphql.anilist.co",{method:"POST",body:JSON.stringify(t),headers:{"Content-Type":"application/json",Accept:"application/json"}}).then(i=>i.json());if(e.errors)throw e.errors;return e.data},N=async t=>(await u({query:`
      query ($media: Int!) {
        Media(id: $media) {
          title {
            english
            native
          }
        }
      }
    `,variables:{media:t}})).Media.title,L=async t=>{const e=await u({query:`
      query ($username: String) {
        User (name: $username) {
          id
        }
      }
    `,variables:{username:t}});return Number(e.User.id)},M=async(t,e)=>{const i=[];for(;;){const s=await u({query:`
        query ($user: Int, $media: Int) {
          Page (page: 1) {
            pageInfo {
              hasNextPage
            }
            activities (userId: $user, mediaId: $media) {
              ... on ListActivity {
                status
                progress
                createdAt
              }
            }
          }
        }
      `,variables:{user:t,media:e}});if(i.push(...s.Page.activities),!s||!s.Page.pageInfo.hasNextPage)break}return i.map(({status:s,progress:r,createdAt:a})=>({status:s,progress:r,createdAt:new Date(a*1e3)}))},D=async(t,e)=>{const i=[];try{const a=await u({query:`
        query ($media: Int, $startTime: Int) {
          AiringSchedule (mediaId: $media, airingAt_lesser: $startTime, sort: TIME_DESC) {
            airingAt
            episode
          }
        }
      `,variables:{media:t,startTime:m(e)}});i.push(a.AiringSchedule)}catch(a){if(!(Array.isArray(a)&&a.every(q)&&a.some(o=>o.status==404)))throw a}const s=new Date,r=new Date(s.getTime()+86400*14*1e3);for(;;){const a=await u({query:`
        query ($media: Int, $startTime: Int, $endTime: Int) {
          Page {
            pageInfo {
              hasNextPage
            }
            airingSchedules (mediaId: $media, airingAt_greater: $startTime, airingAt_lesser: $endTime, sort: TIME) {
              airingAt
              episode
            }
          }
        }
      `,variables:{media:t,startTime:m(e)-1,endTime:m(r)}});if(i.push(...a.Page.airingSchedules),!a||!a.Page.pageInfo.hasNextPage)break}return i.map(({episode:a,airingAt:o})=>({episode:a,airingAt:new Date(o*1e3)}))},d={title:document.querySelector("#title"),canvas:document.querySelector("#canvas-wrapper"),error:document.querySelector("#main-error")},y=t=>t.classList.remove("hidden");async function C(t,e){const i=await L(t),s=await M(i,e);if(console.log(s),!s.length)return;const r=s[0].createdAt,a=await D(e,r);if(console.log(a),!a.length)return;const o=s.map(n=>{var p;const l=n.createdAt,g=n.progress!==null?Number((p=n.progress.match(/(\d+)$/))==null?void 0:p[1]):0;return n.progress===null?{x:l,y:g,label:"Added to plan-to-watch"}:{x:l,y:g}}),w=a.map(n=>({x:n.airingAt,y:n.episode}));new h(d.canvas.querySelector("canvas"),{type:"line",data:{datasets:[{data:o,label:"Progress",stepped:!0,borderColor:"#0061d1",fill:"#0061d1"},{data:w,label:"Goal",stepped:!0,borderColor:"#d10061"}]},options:{scales:{x:{type:"time"}},plugins:{tooltip:{callbacks:{label:n=>{const l=n.dataset.data[n.dataIndex];if(l.label)return l.label;switch(n.datasetIndex){case 0:return`Watched up to episode ${n.formattedValue}`;case 1:const p=n.raw.x.getTime()>new Date().getTime()?"airs":"aired";return`Episode ${n.formattedValue} ${p}`}}}}}}})}const c="MattShnoop",f="21";async function E(){try{const t=parseInt(f);if(isNaN(t))throw new Error("Media ID is not a number");const e=await N(t);document.title=`${c}'s ${e.english} Progress`,d.title.innerText=e.english==e.native?`${c}'s ${e.native}`:`${c}'s ${e.english} / ${e.native}`,h.register($,I,b,v,A,T,S),await C(c,t),y(d.canvas)}catch(t){console.error(t);const e=d.error.querySelector("pre");e&&(e.innerText=JSON.stringify(t,null,2)),y(d.error)}finally{console.log("Done loading")}}E();
