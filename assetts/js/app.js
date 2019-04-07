$(document).ready(function () {

    var config = {
        apiKey: "AIzaSyAm2DDkuRu18rKe2woU5Pj6n3PeWJf6IVY",
        authDomain: "rps-multiplayer-a2b1b.firebaseapp.com",
        databaseURL: "https://rps-multiplayer-a2b1b.firebaseio.com",
        projectId: "rps-multiplayer-a2b1b",
        storageBucket: "rps-multiplayer-a2b1b.appspot.com",
        messagingSenderId: "677023733156"
    };
    firebase.initializeApp(config);

    var database = firebase.database();

    var player1Name = "";
    var player2Name = "";
    var userName = "";
    var player1Choice = "";
    var player2Choice = "";
    var player1 = null;
    var player2 = null;
    var turn = 1;

    database.ref("/players/").on("value", function (snapshot) {

        if (snapshot.child("player1").exists()) {
            player1 = snapshot.val().player1;
            player1Name = player1.name;

            $("#player1Name").text(player1Name);
            $("#player1Wins").html("Wins: " + player1.win)
            $("#player1Losses").html("Losses: " + player1.loss)
            $("#player1Ties").html("Ties: " + player1.tie)
        } else {
            player1 = null;
            player1Name = "";

            $("#player1Name").text("Waiting for Player 1 to join");
            $("#playerPanel1").removeClass("playerPanelTurn");
            $("#playerPanel2").removeClass("playerPanelTurn");
            database.ref("/outcome/").remove();
            $("#roundOutcome").html("");
            $("#waitingNotice").html("");
            $("#player1Stats").html("Win: 0, Loss: 0, Tie: 0");
        }
        
        if (!player1 || !player2) {
            $("#chat").hide();
        }

        if (snapshot.child("player2").exists()) {

            player2 = snapshot.val().player2;
            player2Name = player2.name;

            $("#player2Name").text(player2Name);
            $("#player2Wins").html("Wins: " + player2.win)
            $("#player2Losses").html("Losses: " + player2.loss)
            $("#player2Ties").html("Ties: " + player2.tie)
        } else {
            player2 = null;
            player2Name = "";

            $("#player2Name").text("Waiting for Player 2 to join");
            $("#playerPanel1").removeClass("playerPanelTurn");
            $("#playerPanel2").removeClass("playerPanelTurn");
            database.ref("/outcome/").remove();
            $("#roundOutcome").html("");
            $("#waitingNotice").html("");
            $("#player2Stats").html("Win: 0, Loss: 0, Tie: 0");
        }

        if (player1 && player2) {
            $("#playerPanel1").addClass("playerPanelTurn");
            $("#playerInput").empty()
            $("#chat").show();
            $("#waitingNotice").html("Waiting on " + player1Name + " to choose an option");
        }

        if (!player1 && !player2) {
            database.ref("/chat/").remove();
            database.ref("/turn/").remove();
            database.ref("/outcome/").remove();

            $("#chat").empty();
            $("#playerPanel1").removeClass("playerPanelTurn");
            $("#playerPanel2").removeClass("playerPanelTurn");
            $("#roundOutcome").html("");
            $("#waitingNotice").html("");
        }
    });
    database.ref("/players/").on("child_removed", function (snapshot) {
        var msg = snapshot.val().name + " has disconnected!";
        var chatKey = database.ref().child("/chat/").push().key;
        database.ref("/chat/" + chatKey).set(msg);
    });

    database.ref("/chat/").on("child_added", function (snapshot) {
        var chatMsg = snapshot.val();
        var chatEntry = $("<div>").html(chatMsg);

        if (chatMsg.includes("disconnected")) {
            chatEntry.addClass("chatColorDisconnected");
        } else if (chatMsg.includes("joined")) {
            chatEntry.addClass("chatColorJoined");
        } else if (chatMsg.startsWith(userName)) {
            chatEntry.addClass("chatColor1");
        } else {
            chatEntry.addClass("chatColor2");
        }

        $("#chat").append(chatEntry);
        $("#chat").scrollTop($("#chat")[0].scrollHeight);
    });

    database.ref("/turn/").on("value", function (snapshot) {
        if (snapshot.val() === 1) {
            turn = 1;

            if (player1 && player2) {
                $("#player1Rock").removeClass("optionSelected");
                $("#player1Paper").removeClass("optionSelected");
                $("#player1Scissors").removeClass("optionSelected");
                $("#playerPanel1").addClass("playerPanelTurn");
                $("#playerPanel2").removeClass("playerPanelTurn");
                $("#waitingNotice").html("Waiting on " + player1Name + " to choose an option");
            }
        } else if (snapshot.val() === 2) {
            turn = 2;

            if (player1 && player2) {
                $("#player2Rock").removeClass("optionSelected");
                $("#player2Paper").removeClass("optionSelected");
                $("#player2Scissors").removeClass("optionSelected");
                $("#playerPanel1").removeClass("playerPanelTurn");
                $("#playerPanel2").addClass("playerPanelTurn");
                $("#waitingNotice").html("Waiting on " + player2Name + " to choose an option");
            }
        }
    });

    database.ref("/outcome/").on("value", function (snapshot) {
        $("#roundOutcome").html(snapshot.val());
    });

    $("#add-name").on("click", function (event) {
        event.preventDefault();
        if (($("#name-input").val().trim() !== "") && !(player1 && player2)) {
            if (player1 === null) {
                userName = $("#name-input").val().trim();
                player1 = {
                    name: userName,
                    win: 0,
                    loss: 0,
                    tie: 0,
                    choice: ""
                };

                database.ref().child("/players/player1").set(player1);

                database.ref().child("/turn").set(1);

                database.ref("/players/player1").onDisconnect().remove();
            } else if ((player1 !== null) && (player2 === null)) {
                console.log("Adding Player 2");

                userName = $("#name-input").val().trim();
                player2 = {
                    name: userName,
                    win: 0,
                    loss: 0,
                    tie: 0,
                    choice: ""
                };

                database.ref().child("/players/player2").set(player2);
                database.ref("/players/player2").onDisconnect().remove();
            }

            var msg = userName + " has joined";
            var chatKey = database.ref().child("/chat/").push().key;
            database.ref("/chat/" + chatKey).set(msg);
            $("#name-input").val("");
        }
    });

    $("#send").on("click", function (event) {
        event.preventDefault();

        if ((userName !== "") && ($("#input").val().trim() !== "")) {
            var msg = userName + ": " + $("#input").val().trim();
            $("#input").val("");
            var chatKey = database.ref().child("/chat/").push().key;
            database.ref("/chat/" + chatKey).set(msg);
        }
    });

    $("#playerPanel1").on("click", ".option", function (event) {
        event.preventDefault();
        if (player1 && player2 && (userName === player1.name) && (turn === 1)) {

            var choice = $(this).text().trim();
            if (choice === 'Rock') {
                $("#player1Rock").addClass("optionSelected");
            } else if (choice === 'Paper') {
                $("#player1Paper").addClass("optionSelected");
            } else if (choice === 'Scissors') {
                $("#player1Scissors").addClass("optionSelected");
            }

            player1Choice = choice;
            database.ref().child("/players/player1/choice").set(choice);
            turn = 2;
            database.ref().child("/turn").set(2);
        }
    });

    $("#playerPanel2").on("click", ".option", function (event) {
        event.preventDefault();
        if (player1 && player2 && (userName === player2.name) && (turn === 2)) {

            var choice = $(this).text().trim();
            if (choice === 'Rock') {
                $("#player2Rock").addClass("optionSelected");
            } else if (choice === 'Paper') {
                $("#player2Paper").addClass("optionSelected");
            } else if (choice === 'Scissors') {
                $("#player2Scissors").addClass("optionSelected");
            }

            player2Choice = choice;
            database.ref().child("/players/player2/choice").set(choice);
            rpsCompare();
        }
    });

    function rpsCompare() {

        if (player1.choice === "Rock") {
            if (player2.choice === "Rock") {
                database.ref().child("/outcome/").set("Tie");
                database.ref().child("/players/player1/tie").set(player1.tie + 1);
                database.ref().child("/players/player2/tie").set(player2.tie + 1);
            } else if (player2.choice === "Paper") {
                database.ref().child("/outcome/").set(player2.name + " won");
                database.ref().child("/players/player1/loss").set(player1.loss + 1);
                database.ref().child("/players/player2/win").set(player2.win + 1);
            } else { 
                database.ref().child("/outcome/").set(player1.name + " won");
                database.ref().child("/players/player1/win").set(player1.win + 1);
                database.ref().child("/players/player2/loss").set(player2.loss + 1);
            }

        } else if (player1.choice === "Paper") {
            if (player2.choice === "Rock") {
                database.ref().child("/outcome/").set(player1.name + " won");
                database.ref().child("/players/player1/win").set(player1.win + 1);
                database.ref().child("/players/player2/loss").set(player2.loss + 1);
            } else if (player2.choice === "Paper") {
                database.ref().child("/outcome/").set("Tie");
                database.ref().child("/players/player1/tie").set(player1.tie + 1);
                database.ref().child("/players/player2/tie").set(player2.tie + 1);
            } else { 
                database.ref().child("/outcome/").set(player2.name + " won");
                database.ref().child("/players/player1/loss").set(player1.loss + 1);
                database.ref().child("/players/player2/win").set(player2.win + 1);
            }

        } else if (player1.choice === "Scissors") {
            if (player2.choice === "Rock") {
                database.ref().child("/outcome/").set(player2.name + " won");
                database.ref().child("/players/player1/loss").set(player1.loss + 1);
                database.ref().child("/players/player2/win").set(player2.win + 1);
            } else if (player2.choice === "Paper") {
                database.ref().child("/outcome/").set(player1.name + " won");
                database.ref().child("/players/player1/win").set(player1.win + 1);
                database.ref().child("/players/player2/loss").set(player2.loss + 1);
            } else {
                database.ref().child("/outcome/").set("Tie");
                database.ref().child("/players/player1/tie").set(player1.tie + 1);
                database.ref().child("/players/player2/tie").set(player2.tie + 1);
            }
        }

        turn = 1;
        database.ref().child("/turn").set(1);
    }
});