var zTreeObjA, zTreeObjB;

var filterFileALevel = 0;
var filterFileBLevel = 0;

var setting = {
  view: {
    showIcon: false,
  },
};

var value,
  orig1,
  orig2,
  dv,
  panes = 2,
  highlight = true,
  connect = "align",
  collapse = false;

function parseXml(xml) {
  var dom = null;
  if (window.DOMParser) {
    try {
      dom = new DOMParser().parseFromString(xml, "text/xml");
    } catch (e) {
      dom = null;
    }
  } else if (window.ActiveXObject) {
    try {
      dom = new ActiveXObject("Microsoft.XMLDOM");
      dom.async = false;
      if (!dom.loadXML(xml))
        // parse error ..
        window.alert(dom.parseError.reason + dom.parseError.srcText);
    } catch (e) {
      dom = null;
    }
  } else alert("oops");
  return dom;
}

function initUI() {
  if (value == null) return;
  var target = document.getElementById("view");
  target.innerHTML = "";
  dv = CodeMirror.MergeView(target, {
    value: value,
    origLeft: panes == 3 ? orig1 : null,
    orig: orig2,
    lineNumbers: true,
    mode: "text/html",
    highlightDifferences: highlight,
    connect: connect,
    collapseIdentical: collapse,
  });
}
const btnclick = document.getElementById("loadnewwindow");

btnclick.addEventListener("click", function () {
  //$(".loader").show();

  //   console.log("click btn");

  let input1Data = $("#inputcode1").val();
  let input2Data = $("#inputcode2").val();

  if (input1Data !== "" && input2Data !== "") {
    // let testData = "<div>aa<h1>a</h1></div>";

    let output = window.api.saveAndProcessJson(input1Data, input2Data, $("#pySelect").val());

    // console.log(output);

    initVtree(output[0], output[1]);

    initCodeMr();

    let percentageSim = 100 - ($(".errorAdd:visible").length / zTreeObjA.transformToArray(zTreeObjA.getNodes()).length) * 100;

    if (Math.sign(percentageSim) < 0) {
      percentageSim = 0;
    }

    $("#perc span").html(percentageSim.toFixed(2));

    //$(".loader").hide();
    $("#perc").show();
    $("#percNode").show();
    $(".treecompare").show();
    $(".doccompare").show();

    $("#percNodeSpan1").html($("#formControlRange").val());

    $("#percNodeSpan2").html(calculatePercentage(zTreeObjA.transformToArray(zTreeObjA.getNodes()).length).toFixed(2));
  } else {
    alert("Contents are empty for File A and B");
  }
});

function calculatePercentage(totalVisibleNodes) {
  // calculate percentage

  //   console.log($(".errorAdd:visible"));

  let percentageSim = 100 - ($(".errorAdd:visible").length / totalVisibleNodes) * 100;

  // console.log(percentageSim);
  // console.log(Math.sign(percentageSim) >= 0);

  if (Math.sign(percentageSim) < 0) {
    percentageSim = 0;
  }

  return percentageSim;
}

function initCodeMr() {
  $("#view").show();

  orig1 = document.querySelector("#inputcode1").value;
  orig2 = document.querySelector("#inputcode2").value;
  value = orig1;
  // alert("input1: " + orig1);
  // alert("input2: " + orig2);
  initUI();
  let d = document.createElement("div");
  d.style.cssText = "width: 50px; margin: 7px; height: 14px";
  dv.editor().addLineWidget(5, d);
}

function getRecursiveChilds(childNodes) {
  let retArr = [];

  for (let i = 0; i < childNodes.length; i++) {
    let currentChildNode = childNodes[i];

    // console.log("child - ");
    // console.log(currentChildNode);
    // console.log(currentChildNode.childs.length);

    let currentChildJson = { name: currentChildNode.tagName, children: [] };

    if (currentChildNode.childs.length > 0) {
      let subChildJson = getRecursiveChilds(currentChildNode.childs);

      // console.log(`subChildJson -`);
      // console.log(subChildJson);

      for (let j = 0; j < subChildJson.length; j++) {
        currentChildJson.children.push(subChildJson[j]);
      }
    }

    retArr.push(currentChildJson);
  }
  return retArr;
}

function filterFileA(node) {
  return node.level > filterFileALevel;
}

function filterFileB(node) {
  return node.level > filterFileBLevel;
}

function filterAllNodes(node) {
  return node.level >= 0;
}

function createTreeJson(inputJs) {
  let formedJson = [];

  for (let i = 0; i < inputJs.nodeList.length; i++) {
    let currentNode = inputJs.nodeList[i];

    // console.log(`i = ${i}`);

    // console.log(currentNode);

    let currentJson = { name: currentNode.tagName, children: [] };

    if (currentNode.childs.length > 0) {
      let childJson = getRecursiveChilds(currentNode.childs);

      // console.log(`childJson`);
      // console.log(childJson);

      for (let j = 0; j < childJson.length; j++) {
        currentJson.children.push(childJson[j]);
      }
    }

    formedJson.push(currentJson);
  }

  // console.log(`Fin JSON`);
  // console.log(formedJson);
  return formedJson;
}

function getRecursiveCompare(l1, l2, max) {
  let levelnANodes = l1;
  let levelnBNodes = l2;

  for (let i = 0; i < levelnANodes.length; i++) {
    if (i < levelnBNodes.length) {
      if (levelnANodes[i].name !== levelnBNodes[i].name) {
        // console.log(`highlight ${levelnANodes[i].tId}`);

        // console.log(stringSimilarity.compareTwoStrings(levelnANodes[i].name, levelnBNodes[i].name));

        $("#" + levelnBNodes[i].tId + "_span").addClass("errorAdd");
        $("#" + levelnBNodes[i].tId).addClass("errorAddHighLight");
        recursiveAddToError(levelnBNodes[i].children);
      } else {
        getRecursiveCompare(levelnANodes[i].children, levelnBNodes[i].children, max);
      }
    } else {
      //   console.log(`0BTree differs on ${i} highlight complete pending arrays`);

      for (let j = i; j < levelnBNodes.length; j++) {
        $("#" + levelnBNodes[j].tId + "_span").addClass("errorAdd");
        $("#" + levelnBNodes[j].tId).addClass("errorAddHighLight");
      }
    }
  }

  if (levelnANodes.length < levelnBNodes.length) {
    // present in A but not in B mark all B childs beyond A len as error

    for (let k = levelnANodes.length; k < levelnBNodes.length; k++) {
      $("#" + levelnBNodes[k].tId + "_span").addClass("errorAdd");
      $("#" + levelnBNodes[k].tId).addClass("errorAddHighLight");
      recursiveAddToError(levelnBNodes[k].children);
    }
  }
}

function recursiveAddToError(rNodes) {
  for (let i = 0; i < rNodes.length; i++) {
    $("#" + rNodes[i].tId + "_span").addClass("errorAdd");
    $("#" + rNodes[i].tId).addClass("errorAddHighLight");

    if (rNodes[i].children.length > 0) recursiveAddToError(rNodes[i].children);
  }
}

function initVtree(masterDataJson, compareDataJson) {
  $("#formControlRange").attr("min", 0);
  $("#formControlRange").attr("max", masterDataJson.levelMax);
  $("#formControlRange").val(masterDataJson.levelMax);
  $("#rangePrimary").html(masterDataJson.levelMax);

  $("#formControlRange1").attr("min", 0);
  $("#formControlRange1").attr("max", compareDataJson.levelMax);
  $("#formControlRange1").val(compareDataJson.levelMax);
  $("#rangePrimary1").html(compareDataJson.levelMax);

  let treeAData = createTreeJson(masterDataJson);
  let treeBData = createTreeJson(compareDataJson);

  zTreeObjA = $.fn.zTree.init($("#treeDemo"), setting, treeAData);

  zTreeObjA.expandAll(true);

  zTreeObjB = $.fn.zTree.init($("#treeDemo1"), setting, treeBData);

  zTreeObjB.expandAll(true);

  //   console.log(zTreeObjB.transformToArray(zTreeObjB.getNodes()));
  //   console.log(zTreeObjA.transformToArray(zTreeObjA.getNodes()));

  //   console.log(jsonpath.query(zTreeObjA.transformToArray(zTreeObjA.getNodes()), "$..[?(@.level == 2)].children..name"));

  // match levels

  matchLevelMax = 0;

  let level1ANodes = zTreeObjA.getNodesByParam("level", "1", null);
  let level1BNodes = zTreeObjB.getNodesByParam("level", "1", null);

  for (let i = 0; i < level1ANodes.length; i++) {
    if (i < level1BNodes.length) {
      if (level1ANodes[i].name !== level1BNodes[i].name) {
        // console.log(`highlight ${level1ANodes[i].tId}`);

        // console.log(stringSimilarity.compareTwoStrings(level1ANodes[i].name, level1BNodes[i].name));

        $("#" + level1BNodes[i].tId + "_span").addClass("errorAdd");
        $("#" + level1BNodes[i].tId).addClass("errorAddHighLight");
      }

      getRecursiveCompare(level1ANodes[i].children, level1BNodes[i].children, matchLevelMax);
    } else {
      //   console.log(`1BTree differs on ${i} highlight complete pending arrays`);
    }
  }

  if (level1ANodes.length < level1BNodes.length) {
    // present in A but not in B mark all B childs beyond A len as error

    for (let j = level1ANodes.length; j < level1BNodes.length; j++) {
      $("#" + level1BNodes[j].tId + "_span").addClass("errorAdd");
    }
  }

  $("#formControlRange").change(function () {
    $("#rangePrimary").html(this.value);

    if ($("#isSyncLevels").is(":checked") && $("#formControlRange1").val() != this.value) {
      //   console.log("Change in A slid make to B");
      $("#formControlRange1").val(this.value);
      $("#formControlRange1").trigger("change");
      $("#rangePrimary1").html(this.value);
    }

    let allNodes = zTreeObjA.getNodesByFilter(filterAllNodes);

    zTreeObjA.showNodes(allNodes);

    filterFileALevel = this.value;

    let hideNodes = zTreeObjA.getNodesByFilter(filterFileA);

    zTreeObjA.hideNodes(hideNodes);

    // recalculate percentage
    $("#percNodeSpan1").html($("#formControlRange").val());
    $("#percNodeSpan2").html(calculatePercentage(zTreeObjA.transformToArray(zTreeObjA.getNodes()).length - hideNodes.length).toFixed(2));
  });
  $("#formControlRange1").change(function () {
    $("#rangePrimary1").html(this.value);

    if ($("#isSyncLevels").is(":checked") && $("#formControlRange").val() != this.value) {
      //   console.log("Change in B slid make to A");
      $("#formControlRange").val(this.value);
      $("#formControlRange").trigger("change");
      $("#rangePrimary").html(this.value);
    }

    let allNodes = zTreeObjB.getNodesByFilter(filterAllNodes);

    zTreeObjB.showNodes(allNodes);

    filterFileBLevel = this.value;

    let hideNodes = zTreeObjB.getNodesByFilter(filterFileB);

    zTreeObjB.hideNodes(hideNodes);

    // recalculate percentage
    $("#percNodeSpan1").html($("#formControlRange").val());
    $("#percNodeSpan2").html(calculatePercentage(zTreeObjA.transformToArray(zTreeObjA.getNodes()).length - hideNodes.length).toFixed(2));
  });
}

$(document).ready(function () {
  $("#view").hide();
  $("#perc").hide();
  $("#percNode").hide();
  $(".treecompare").hide();
  $(".doccompare").hide();
  $(".loader").hide();
});
