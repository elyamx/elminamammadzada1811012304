var express = require('express');
var router = express.Router();

var request = require('postman-request');
var apiSecenekleri = {
  sunucu: "https://elminamammadzada1811012304.herokuapp.com",
  apiYolu: '/api/mekanlar/'
}
var istekSecenekleri
var footer = "Elmina Mammadzada 2021"

var mesafeyiFormatla = function (mesafe) {
  var yeniMesafe, birim;
  if (mesafe > 1000) {
    yeniMesafe = parseFloat(mesafe / 1000).toFixed(2);
    birim = ' km';
  } else {
    yeniMesafe = parseFloat(mesafe).toFixed(1);
    birim = 'm';
  }
  return yeniMesafe + birim;
}

var anaSayfaOlustur = function (req, res, cevap, mekanListesi) {
  var mesaj;
  try {
    if (!(mekanListesi instanceof Array)) {
      mesaj = "API HATASI: Birşeyler ters gitti";
      mekanListesi = [];
    } else {
      if (!mekanListesi.length) {
        mesaj = "Civarda Herhangi Bir Mekan Bulunamadı!";
      }
    }
    res.render('mekanlar-liste',
      {
        baslik: 'Mekan32',
        sayfaBaslik: {
          siteAd: 'Mekan32',
          aciklama: 'Isparta Civarındaki Mekanları Keşfedin!'
        },
        footer: footer,
        mekanlar: mekanListesi,
        mesaj: mesaj,
        cevap: cevap
      });
  } catch (err) {
    console.log(err)
  }

}

const anaSayfa = function (req, res) {

  try {
    istekSecenekleri =
    {
      url: apiSecenekleri.sunucu + apiSecenekleri.apiYolu,
      method: "GET",
      json: {},

      qs: {
        enlem: req.query.enlem,
        boylam: req.query.boylam
      }
    };
    console.log(istekSecenekleri)
    request(
      istekSecenekleri,
      function (hata, cevap, mekanlar) {
        var i, gelenMekanlar;
        gelenMekanlar = mekanlar;

        if (!hata && gelenMekanlar.length) {
          for (i = 0; i < gelenMekanlar.length; i++) {
            gelenMekanlar[i].mesafe =
              mesafeyiFormatla(gelenMekanlar[i].mesafe);
          }
        }
        anaSayfaOlustur(req, res, cevap, gelenMekanlar);
      }
    );
  } catch (err) {
    console.log(err)
  }

}

var detaySayfasiOlustur = function (req, res, mekanDetaylari) {
  res.render('mekan-detay',
    {
      baslik: mekanDetaylari.ad,
      footer: footer,
      sayfaBaslik: mekanDetaylari.ad,
      mekanBilgisi: mekanDetaylari
    });
}

var hataGoster = function (req, res, durum) {
  var baslik, icerik;
  if (durum == 404) {
    baslik = "404, Sayfa Bulunamadı!";
    icerik = "Kusura bakmayın sayfayı bulamadık!";
  }
  else {
    baslik = durum + ", Bir şeyler ters gitti!";
    icerik = "Ters giden bir şey var!";
  }
  res.status(durum);
  res.render('hata', {
    baslik: baslik,
    icerik: icerik,

  });
};



var mekanBilgisiGetir = function (req, res, callback){
  var istekSecenekleri;

  istekSecenekleri = {
    url : apiSecenekleri.sunucu + apiSecenekleri.apiYolu + req.params.mekanid,

    method : "GET",
    json : {}
  };
  request(
    istekSecenekleri,
        function(hata, cevap, mekanDetaylari){
          var gelenMekan = mekanDetaylari;
          if(cevap.statusCode==200) {
            gelenMekan.koordinatlar = {
              enlem : mekanDetaylari.koordinatlar[0],
              boylam : mekanDetaylari.koordinatlar[1]
            };
            callback(req, res,gelenMekan);
          } else {
            hataGoster(req, res, cevap.statusCode);
          }
        }

  );

};
/*var mekanBilgisi = function (req, res, callback) {
  istekSecenekleri = {
    url: apiSecenekleri.sunucu + apiSecenekleri.apiYolu + req.params.mekanid,
    method: "GET",
    json: {}
  };
  request(
    istekSecenekleri,
    function (hata, cevap, mekanDetaylari) {
      var gelenMekan = mekanDetaylari;
      //console.log("mekanDetaylari", mekanDetaylari)
      if (cevap.statusCode == 200) {
        gelenMekan.koordinatlar= {
          enlem : mekanDetaylari.koordinatlar[0],
          boylam : mekanDetaylari.koordinatlar[1],
        }
        detaySayfasiOlustur(req, res, mekanDetaylari);
      } else {
        hataGoster(req, res, cevap.statusCode);
      }
    }
  );
}*/

 const mekanBilgisi = function(req, res, callback) {
  mekanBilgisiGetir(req , res , function(req , res , cevap){
   detaySayfasiOlustur(req , res , cevap);
  });
 };
 
 


  var yorumSayfasiOlustur = function (req, res, mekanBilgisi) {
  res.render('yorum-ekle', { 
     baslik: mekanBilgisi.ad + 'Mekanına Yorum Ekle',
     sayfaBaslik: mekanBilgisi.ad + 'Mekanına Yorum Ekle' ,
     hata: req.query.hata
});
};
const yorumEkle = function(req , res) {
    mekanBilgisiGetir(req , res , function(req , res , cevap){
      yorumSayfasiOlustur(req , res , cevap);
    }
      )
    }

  
const yorumumuEkle = function(req, res) {
  var gonderilenYorum, mekanid;
  mekanid = req.params.mekanid;
  gonderilenYorum = {
    yorumYapan: req.body.name,
    puan: parseInt(req.body.rating, 10),
    yorumMetni : req.body.review
  };
  istekSecenekleri = {
    url : apiSecenekleri.sunucu + apiSecenekleri.apiYolu + mekanid + '/yorumlar',
    method : 'POST',
    json : gonderilenYorum
  };
  if(!gonderilenYorum.yorumYapan || !gonderilenYorum.puan || !gonderilenYorum.yorumMetni) {
    res.redirect('/mekan/' + mekanid + '/yorum/yeni?hata=evet');
  } else {
    request(istekSecenekleri, function(hata, cevap, body){
      if (cevap.statusCode === 201) {
        res.redirect('/mekan/' + mekanid);
      } else if(cevap.statusCode === 400 && body.name && body.name === 'ValidationError') {
        res.redirect('/mekan/' + mekanid + '/yorum/yeni?hata=evet');
      } else {
        hataGoster(req, res, cevap.statusCode);
      }
    });
  }
}

module.exports = {
  anaSayfa,
  mekanBilgisi,
  yorumEkle,
  yorumumuEkle
};