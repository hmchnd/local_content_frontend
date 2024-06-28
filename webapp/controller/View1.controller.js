sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
],
    function (Controller, JSONModel) {
        "use strict";

        return Controller.extend("com.kpo.supplierreport.controller.View1", {
            onInit: function () {
                let data = [{
                    "pCode": "",
                    "contractNo": "",
                    "purchaseMethood": "",
                    "contractSubject": "",
                    "contractAwardDate": "",
                    "contractExpireDate": "",
                    "totalConValue": "",
                    "orgAndLegal": "",
                    "COR": "",
                    "GWS": "",
                    "BIN": "",
                    "addOfPhy": "",
                    "codeOfGWS": "",
                    "nameAndBrief": "",
                    "codeForUnits": "",
                    "procScope": "",
                    "actualProc": "",
                    "regNo": "",
                    "localGoods": "",
                    "CTKZ": "",
                    "dateOfCTKZ": "",
                    "localConInGoods": "",
                    "localConInWS": "",
                }];
                
                let data5 = [{
                    "companyName": "",
                    "reportingperiod": "",
                    "totalpayrol%": "",
                    "sharein%": "",
                }];
                
                let fifthTable = new JSONModel(data5);
                this.getView().setModel(fifthTable, "fifthTable");
                
                let firstTable = new JSONModel(data);
                this.getView().setModel(firstTable, "firstTable");

                let data1 = [{
                    "companyName": "",
                    "nameofGWS": "",
                    "unit": "",
                    "volofPur": "",
                    "actualvolofpurexcVAT": "",
                    "localcontent": "",
                    "localcontentinWS": "",
                    "nameofManufactur": "",
                    "IIN": "",
                    "certificateNo": "",
                    "DOI": "",
                    "GWSCode": "",
                    "regionofManufac": "",
                }];
                
                let secondTable = new JSONModel(data1);
                this.getView().setModel(secondTable, "secondTable");

                let data2 = [{
                    "totalnoofemploye": "",
                    "noofemployerokcitizen": "",
                }];
                
                let fourthtable = new JSONModel(data2);
                this.getView().setModel(fourthtable, "fourthtable");

                let data3 = [{
                    "ContractorName": "",
                    "Tnoe": "",
                    "noe": "",
                    "Tnofe": ""
                }];
                
                let thirdtable = new JSONModel(data3);
                this.getView().setModel(thirdtable, "thirdtable");
            },

            onAdd1: function () {
                let model = this.getView().getModel("firstTable");
                let modelData = model.getData();
                let newData = {
                    "pCode": "",
                    "contractNo": "",
                    "purchaseMethood": "",
                    "contractSubject": "",
                    "contractAwardDate": "",
                    "contractExpireDate": "",
                    "totalConValue": "",
                    "orgAndLegal": "",
                    "COR": "",
                    "GWS": "",
                    "BIN": "",
                    "addOfPhy": "",
                    "codeOfGWS": "",
                    "nameAndBrief": "",
                    "codeForUnits": "",
                    "procScope": "",
                    "actualProc": "",
                    "regNo": "",
                    "localGoods": "",
                    "CTKZ": "",
                    "dateOfCTKZ": "",
                    "localConInGoods": "",
                    "localConInWS": "",
                };
                modelData.push(newData);
                model.setData(modelData);
                model.refresh();
            },
            
            onAdd2: function () {
                let model = this.getView().getModel("secondTable");
                let modelData = model.getData();
                let newData = {
                    "companyName": "",
                    "nameofGWS": "",
                    "unit": "",
                    "volofPur": "",
                    "actualvolofpurexcVAT": "",
                    "localcontent": "",
                    "localcontentinWS": "",
                    "nameofManufactur": "",
                    "IIN": "",
                    "certificateNo": "",
                    "DOI": "",
                    "GWSCode": "",
                    "regionofManufac": "",
                };
                modelData.push(newData);
                model.setData(modelData);
                model.refresh();
            },
            
            onAdd3: function () {
                let model = this.getView().getModel("thirdtable");
                let modelData = model.getData();
                let newData = {
                    "ContractorName": "",
                    "Tnoe": "",
                    "noe": "",
                    "Tnofe": ""
                };
                modelData.push(newData);
                model.setData(modelData);
                model.refresh();
            },
            
            onAdd4: function () {
                let model = this.getView().getModel("fourthtable");
                let modelData = model.getData();
                let newData = {
                    "totalnoofemploye": "",
                    "noofemployerokcitizen": "",
                };
                modelData.push(newData);
                model.setData(modelData);
                model.refresh();
            },
            
            onAdd5: function () {
                let model = this.getView().getModel("fifthTable");
                let modelData = model.getData();
                let newData = {
                    "companyName": "",
                    "reportingperiod": "",
                    "totalpayrol%": "",
                    "sharein%": "",
                };
                modelData.push(newData);
                model.setData(modelData);
                model.refresh();
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