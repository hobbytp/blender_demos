// Run via Playwright browser_run_code_unsafe(filename), with Vite on port 5173.
async(page)=>{
  const sample=await page.evaluate(()=>new URL(location.href).searchParams.get('sample')||'restore');
  await page.goto(`http://127.0.0.1:5173/?sample=${sample}`);
  await page.waitForSelector('audio',{state:'attached'});
  await page.evaluate(()=>{
    window.__playbackSamples=[];
    window.__playbackTimer=setInterval(()=>window.__playbackSamples.push({wall:performance.now(),frame:Number(document.querySelector('input[type=range]').value),audio:[...document.querySelectorAll('audio')].filter(a=>!a.paused).map(a=>({src:a.currentSrc,time:a.currentTime}))}),100);
  });
  try{
    await page.getByRole('button',{name:'播放',exact:true}).click();
    await page.waitForTimeout(12000);
    const result=await page.evaluate(()=>{
      const rows=window.__playbackSamples.filter(r=>r.frame>0),first=rows[0],last=rows.at(-1);
      const rewinds=[];
      for(let i=1;i<rows.length;i++)for(const a of rows[i].audio){const previous=rows[i-1].audio.find(p=>p.src===a.src);if(previous&&a.time<previous.time-.15)rewinds.push({frame:rows[i].frame,from:previous.time,to:a.time});}
      return {rewinds,overlaps:rows.filter(r=>r.audio.length>1).length,wallSeconds:(last.wall-first.wall)/1000,videoSeconds:(last.frame-first.frame)/30,audioObserved:rows.some(r=>r.audio.length===1)};
    });
    if(result.rewinds.length||result.overlaps||!result.audioObserved||Math.abs(result.wallSeconds-result.videoSeconds)>.75)throw Error(JSON.stringify({sample,...result}));
    return {sample,...result};
  }finally{
    await page.evaluate(()=>clearInterval(window.__playbackTimer));
    await page.getByRole('button',{name:'暂停',exact:true}).click().catch(()=>{});
  }
}
