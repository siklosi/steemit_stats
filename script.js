var price = 0;
var balancestt;
var balancet;
var powert;
var divvotes;
var steem_user = localStorage.getItem("stuser");
if (!steem_user) {
    steem_user = "siklosi";
}


$(document).ready(function() { // Scale a bit if on desktop looks nicer
    $('.modal').modal();
    if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {} else {
        $(".deck").css('margin-left', '30%');
        $(".deck").css('width', '40%');
    }
    //Made everything and tried on dothers iphone and when popup for user input opens keyboard pushes popup out of screen
    //tried looking on internet but found no working solution, so I decided to try and move modal so it's still in screen
    //when keyboard opens. This worked but then when I tried on Android it was same as on iphone before adding style wierd
    //so I added bottom and height styling only for Apple devices lost an hour for nothing :(
    if (/Ipad|iPhone|iPod/i.test(navigator.userAgent)) { 
        $("#modaluser").css('bottom', '300px');
        $(".deck").css('height', '200px');
    }

    get_steem_data(); //Start
  
   $("#statsdiv").click(function(){
   //window.open("https://steemit.com/@"+steem_user);
   window.location = "https://steemit.com/@"+steem_user;
   });
});


function get_steem_data() {
    //steem.api.setOptions({ url: 'wss://steemd.steemitstage.com' }); 
    steem.api.getDynamicGlobalProperties(function(err, globals) {

        steem.api.getAccounts([steem_user], function(err, result) {
            $(".sttitle").text(steem_user);
            var totalSteem = Number(globals.total_vesting_fund_steem.split(' ')[0]);
            var totalVests = Number(globals.total_vesting_shares.split(' ')[0]);
            var userVests = Number(result[0].vesting_shares.split(' ')[0]);
            $("#power").text(Math.round((totalSteem * userVests / totalVests) * 100) / 100);
            powert = Math.round((totalSteem * userVests / totalVests) * 100) / 100;
            var reputation = steem.formatter.reputation(result[0].reputation);
            $("#reputation").text(reputation);
            $("#balance").text(result[0].sbd_balance.split(' ')[0]);
            $("#balancest").text(result[0].balance.split(' ')[0]);
        });
    });

    steem.api.getFollowCount(steem_user, function(err, result) { //number of followers
        $("#followers").text(result.follower_count);
    });



    steem.api.getDiscussionsByAuthorBeforeDate(steem_user, "", "2060-08-01T00:00:00", 100, function(err, result) { //collect posts
        $(".spinner").remove();
        for (var i = 0; i < result.length; i++) {
            price = price + parseFloat(result[i].pending_payout_value.replace(" SBD", ""));//Add posts payout to total pending
            var price_new = parseFloat(result[i].pending_payout_value.replace(" SBD", ""));
            if (price_new > 0) {//If pending payout greater then 0 display post
                var timeto = new Date((Date.parse(result[i].created) + (7 * 24 * 60 * 60 * 1000)));
                timeto = convertUTCDateToLocalDate(timeto); //Convert UTC time from steemit post to local time
                var divprice = price_new;
                var divclock = result[i].id + "clock";
                divvotes = result[i].id + "votes";
                var divtitle = result[i].root_title;
                var divurl = "https://steemit.com" + result[i].url;
                var div = `      <a class="card property summary date aggregate hoverable waves-effect waves-block tcolor2" href="` + divurl + `">
                    <div class="card-content">
                        <span class="ct">` + divtitle + `</span>
                        <div class="container" data-bind="">
                            <div class="row">
                                <div class="col s12">
                                <div><span class="label" id="` + divclock + `"></span><span class="label_prices">  -  ` + divprice + ` SBD</span><span class="votes_right" id='` + divvotes + `'></span></span></div>
                            </div>
                            </div>
                        </div>
                    </div>
                </a>
`;
                $("#ccc1").prepend(div);

                var clock = $('#' + result[i].id + "clock"); //Add countdown to posts
                $('#' + result[i].id + "clock").countdown(timeto)
                    .on('update.countdown', function(event) {
                        if (event.strftime('%d').slice(-1)==="0"){
                          $(this).html(event.strftime('%H:%M:%S'));
                        }else if (event.strftime('%d').slice(-1)==="1"){
                          $(this).html(event.strftime('%D').slice(-1)+ event.strftime(' Day - %H:%M:%S'));
                        }else{
                          $(this).html(event.strftime('%D').slice(-1)+ event.strftime(' Days - %H:%M:%S'));
                        }

                    })
                    .on('finish.countdown', function(event) {
                        $(this).html('Already Paid')
                        $(this).css('color', 'green');
                    });

                steem.api.getActiveVotes(steem_user, result[i].permlink, function(err, result) {
                    $("#" + this.divvotes_int).text(result.length + " Votes");
                }.bind({ divvotes_int: divvotes }));

            }

        }
        $("#countdown").prepend("<hr>");
        $("#unpaid").text(Math.round(price));
        coinmarketcap_steem(); //check price of steem and append usd prices to steem stats
        coinmarketcap_sbd(); //check price of steem dollar and append usd prices to steem stats
    });

}

function select_user() {
  var d = $('#modaluser'); 
  d.scrollTop (d[0].scrollHeight - d.height ());
    steem_user = $("#steem_user_input").val().replace(/^@/, '').toLowerCase(); //Strip @ if it's on begining of username
    localStorage.setItem("stuser", steem_user);
    $("#ccc1").empty();
    get_steem_data();
}

function coinmarketcap_steem() {
    $.ajax({
        url: 'https://api.coinmarketcap.com/v1/ticker/steem/',
        success: function(data) {
            //data = JSON.parse(data);
            var price = data[0].price_usd;
            var stpower = $("#power").text();
            var balancest = $("#balancest").text();
            $("#power").append(" STEEM - $" + Math.round(stpower * price));
            $("#balancest").append(" STEEM - $" + Math.round(balancest * price));
        }
    });
}

function coinmarketcap_sbd() {
    $.ajax({
        url: 'https://api.coinmarketcap.com/v1/ticker/steem-dollars/',
        success: function(data) {
            //data = JSON.parse(data);
            var price = data[0].price_usd;
            var balance = $("#balance").text();
            var unpaid = $("#unpaid").text();
            $("#balance").append(" SBD - $" + Math.round(balance * price));
            $("#unpaid").append("(" + Math.round(unpaid * .75) + ")SBD - $" + Math.round(unpaid * price * .75 / 2));
        }
    });
}


function convertUTCDateToLocalDate(date) {//Function for converting UTC time of post to local time
    var newDate = new Date(date.getTime()+date.getTimezoneOffset()*60*1000);
    var offset = date.getTimezoneOffset() / 60;
    var hours = date.getHours();
    newDate.setHours(hours - offset);
    return newDate;   
}