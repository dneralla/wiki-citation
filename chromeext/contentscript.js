var regex = /citation needed/;
var URL = "http://localhost:4567/get-topranked-citation";
query_list();



function query_list()
{

   
   var para = document.getElementsByTagName("P");
   for(var i = 0 ;i < para.length ;i++)
	  {
		
		if (regex.test(para[i].innerText)) {
		   alert(snippet(para[i].innerText,"citation needed"));
		   addReference(getCitation());
		   refrenceNum = document.querySelectorAll(".references li").length;
		   para[i].innerHTML = para[i].innerHTML.replace(new RegExp("citation needed", "g"), refrenceNum.toString());
		   chrome.extension.sendRequest({}, function(response) {});
	    } 
 }
  
}

function snippet(stringToSearch, phrase) { 

 var regExp = eval("/(\\S+\\s){0,15}\\S*" + phrase + "\\S*(\\s\\S+){0,15}/g") 
 return stringToSearch.match(regExp) 
}

function getCitation()
{
  xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET",URL,false)
  xmlhttp.send();

  alert(xmlhttp.responseText);
  return xmlhttp.responseText ;
}

function addReference(referenceText)
{
    
    x= document.getElementsByClassName('references')[0];
    y = document.createElement('li');
    y.appendChild(document.createTextNode(referenceText));
    x.appendChild(y);
    

}
