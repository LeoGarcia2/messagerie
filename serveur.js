const express = require("express");
//Inclusion du framework Express
const cors = require("cors");
//Inclusion du middleware CORS
const http = require("http");
//Inclusion de la base de notre serveur web
const app = express();
//Création de l'application Express
app.use(cors());
//Autorisation des requêtes cross origin pour éviter des erreurs avec Socket.io
app.use(express.urlencoded({ extended: true }));
//Cette ligne est obligatoire pour accéder aux variables des requêtes POST
let server = http.createServer(app);
//Création du serveur HTTP en spécifiant l'application utilisée
const io = require("socket.io").listen(server);
//Écouter les évènements avec socket.io

io.sockets.on("connection", function(socket){
	let participants = [];
    //C'est dans cette fonction que l'on réagira à tous les évènements reçus par le serveur.
    socket.on("pseudo-choisi", function(nouveauParticipant){
    //On récupère l'objet {pseudo: pseudo} envoyé depuis le client en le nommant "nouveauParticipant".
	    let pris = false;
	    participants.forEach(function(participant){
	    //On parcourt tous les participants avec forEach afin de vérifier que personne n'a déjà pris notre pseudo.
		    if(participant.pseudo == nouveauParticipant.pseudo){
		    	pris = true;
		    }
		});
	    if(!pris){
	    	participants.push({pseudo: nouveauParticipant.pseudo});
		    //Si le pseudo n'était pas pris, alors on ajoute notre participant à l'array "participants".
		}
		socket.emit("pseudo-pris", {pris: pris});
	    //On envoie la réponse au client qui a émis l'évènement.
	});

    socket.on("connexion", function(participant){
    	socket.broadcast.emit("connexion", {pseudo: participant.pseudo});
	});

    socket.on("envoi-message", function(messageData){
    	socket.broadcast.emit("reception-message", {pseudo: messageData.pseudo, message: messageData.message});
		//A l'inverse de "socket.emit", "socket.broadcast.emit" renvoie la réponse à tous les clients connectés excepté celui qui l'a émis.
	});    

    socket.on("deconnexion", function(participant){
    	for(let i=0; i<participants.length; i++){
    		if(participants[i].pseudo == participant.pseudo){
    			participants.splice(i, 1);
    			//On parcourt l'array "participants", si le pseudo de la personne qui se déconnecte est égal au pseudo du participant à l'index i de l'array, celui-ci est supprimé de cet array.
			}
		}
		socket.broadcast.emit("deconnexion", {pseudo: participant.pseudo});
	});
});

app.use(express.static(__dirname + "/public"));
//Utiliser le sous-dossier "public" pour servir des fichiers statiques
//Le routing de notre application est géré ici, le point virgule est omis en fins de fonctions afin de pouvoir enchainer celles-ci.
//La fonction "get" gère les routes qui ne nécessitent pas de paramètre POST.
//La fonction post" gère les routes qui nécessitent des paramètres POST.
//La fonction "use" en fin de chaine permet de gérer les routes inconnues de l'application.
app.get("/", function(request, response){
	response.render("login.ejs", {title: 'Connexion'});
})
.post("/messagerie", function(request, response){
	response.render("messagerie.ejs", {title: 'Messagerie', pseudo: request.body.pseudo});
})
.use(function(request, response, next){
	response.setHeader("Content-Type", "text/plain");
	response.status(404).send("La page demandée n'existe pas.");
});
server.listen(4200, "0.0.0.0");
//Le serveur écoute sur le port 4200 les requêtes venant de n'importe quelle adresse ipv4.
//Le pare feu de la machine (et les redirections du routeur dans le cas d'un serveur hébergé chez vous) doivent également être configurés afin de rendre votre application accessible depuis le web.