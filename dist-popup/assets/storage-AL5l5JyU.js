async function c(){return new Promise(a=>{chrome.storage.local.get(["activecampaign_data"],t=>{a(t.activecampaign_data??{contacts:[],deals:[],tasks:[],lastSync:0})})})}export{c as getData};
