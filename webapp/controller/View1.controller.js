sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
],
    function (Controller, JSONModel) {
        "use strict";

        return Controller.extend("com.kpo.supplierreport.controller.View1", {
            onInit: function () {
               
            },

            onDelete1: function () {
                let model = this.getView().getModel("firstTable");
                let table = this.byId("itemsTable1");
                let selectedIndices = table.getSelectedIndices();
                let modelData = model.getData();
                selectedIndices.sort((a, b) => b - a).forEach(index => {
                    modelData.splice(index, 1);
                });
                model.setData(modelData);
                model.refresh();
                table.clearSelection();
            },
            
            onDelete2: function () {
                let model = this.getView().getModel("secondTable");
                let table = this.byId("itemsTable2");
                let selectedIndices = table.getSelectedIndices();
                let modelData = model.getData();
                selectedIndices.sort((a, b) => b - a).forEach(index => {
                    modelData.splice(index, 1);
                });
                model.setData(modelData);
                model.refresh();
                table.clearSelection();
            },
            
            onDelete3: function () {
                let model = this.getView().getModel("thirdtable");
                let table = this.byId("itemsTable03");
                let selectedIndices = table.getSelectedIndices();
                let modelData = model.getData();
                selectedIndices.sort((a, b) => b - a).forEach(index => {
                    modelData.splice(index, 1);
                });
                model.setData(modelData);
                model.refresh();
                table.clearSelection();
            },
            
            onDelete4: function () {
                let model = this.getView().getModel("fourthtable");
                let table = this.byId("itemsTable3");
                let selectedIndices = table.getSelectedIndices();
                let modelData = model.getData();
                selectedIndices.sort((a, b) => b - a).forEach(index => {
                    modelData.splice(index, 1);
                });
                model.setData(modelData);
                model.refresh();
                table.clearSelection();
            },
            
            onDelete5: function () {
                let model = this.getView().getModel("fifthTable");
                let table = this.byId("itemsTable4");
                let selectedIndices = table.getSelectedIndices();
                let modelData = model.getData();
                selectedIndices.sort((a, b) => b - a).forEach(index => {
                    modelData.splice(index, 1);
                });
                model.setData(modelData);
                model.refresh();
                table.clearSelection();
            },
        });
    });