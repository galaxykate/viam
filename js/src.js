// Parse raw images
function preprocessImages() {
  var s = [];
  $.each(rawImg.split(/\s+/), function(index, line) {
    console.log(line);
    var sections = line.split(".");
    var tags = sections[0].split("-");
    s.push("{\nfilename:\"" + sections[0] + "\",\nid:\"img-" + sections[0] + "\",\ntitle:\"" + tags[1] + "\",\ntags:[\"" + tags[0] + "\"],\ntype:\"" + sections[1] + "\"\n}");

  });
  console.log(s.join(",\n"));
}


function preprocessReferences(raw) {

  // Replace newlines with spaces
  raw = raw.replace(/(?:\r\n|\r|\n)/g, " ");

  // raw = "@test{ @foo {@bar}} @test{@foo}"
  //var referencesRaw = splitOnUnprotected(raw.substring(0, 50000), " ");
  //var referencesRaw = splitOnUnprotected(raw, " ");
  var referencesRaw = raw.substring(0, 50000).split("@");
  var allRefs = {};
  var allAuthors = {};
  var allDates = {};

  function authorToKey(author) {
    if (!author.firstName)
      return author.lastName;
    var key = author.lastName.replace(/[.,\/#!$%\^&\*;:{}=\-_`~() ]/g, "_") + "_" + author.firstName.replace(/[ .,\/#!$%\^&\*;:{}=\-_`~()]/g, "_");
    return key;
  }

  $.each(referencesRaw, function(index, ref) {
    //   console.log(ref);
    ref = ref.trim();
    if (ref.length > 10) {
      var parsed = parseBibTextToJSON(ref);
      if (parsed.year) {
        console.log(parsed.year);
        if (!allDates[parsed.year])
          allDates[parsed.year] = 0;
        allDates[parsed.year]++;
      }

      if (parsed.author) {
        $.each(parsed.author, function(index, author) {
          var key = authorToKey(author);

          if (allAuthors[key] === undefined) {
            allAuthors[key] = {
              author: author,
            }
          }
        });
      }

      if (parsed.id === undefined) {
        console.warn(ref);
      }

      if (allRefs[parsed.id] !== undefined) {
        var min = 50;
        //  console.warn("Collision!", inQuotes(parsed.raw.substring(0, min)) + " " + inQuotes(allRefs[parsed.id].raw.substring(0, min)));
      }
      allRefs[parsed.id] = parsed;
    }
  });

  console.log(allAuthors);
  var data = [];

  $.each(allAuthors, function(key, author) {
    data.push({
      classes: "author",
      data: {
        id: key,
        name: key
      }
    });


  });


  $.each(allRefs, function(key, ref) {
    data.push({
      classes: "publication",
      data: {
        id: key,
        name: ref.title
      }
    });

    if (ref.author) {
      $.each(ref.author, function(index, author) {
        var authorKey = authorToKey(author);
        var edge = {
          data: {
            id: key + "-" + authorKey,
            source: authorKey,
            target: key,
          }
        };
        data.push(edge);
      });
    }

/*
    if (ref.year) {

      var edge = {
        data: {
          id: key + "-" + ref.year,
          source: ref.year,
          target: key,
        }
      };
      data.push(edge);

    }
    */
  });

/*
  $.each(allDates, function(year, count) {
    data.push({
      classes: "year",
      data: {
        id: year,
        name: year + ": " + count
      }
    });
  });

*/

  createCyto(data);
  //console.log(s.join(",\n"));
}

function parseBibTextToJSON(bibtex) {

  var parsed = {
    raw: bibtex
  };
  bibtex = bibtex.trim();
  var start = bibtex.indexOf("{");
  var pretex = bibtex.substring(0, start);


  parsed.type = pretex;
  subsections = splitOnUnprotected(bibtex.substring(start + 1, bibtex.length - 1), ",", false, {
    openChars: "\"{",
    closeChars: "\"}"
  });

  subsections = subsections.filter(s => s.trim().length > 0);

  parsed.id = subsections[0];
  for (var i = 1; i < subsections.length; i++) {
    subsections[i] = subsections[i].trim();
    var s2 = subsections[i].split("=");
    var key = s2[0].trim();

    // remove the brackets

    if (s2[1] === undefined) {
      console.log(bibtex);
      console.log(subsections[i]);

    }

    var content = s2[1];
    if (!content)
      console.log(subsections[i]);
    else {
      content = content.trim();

      // trim enclosing brackets
      if (isInCurlyBrackets(content) || isInQuotes(content)) {
        content = content.substring(1, s2[1].length - 1);
      }

      //console.log(content, s2[1]);


      // subparsing
      switch (key) {
        case "author":
          content = content.split(" and ").map(function(name) {
            var nameSections = name.split(",");
            if (nameSections.length < 2)
              console.log(name);
            var first = nameSections[1];
            if (first) {
              first = first.trim();
            }
            return {
              firstName: first,
              lastName: nameSections[0].trim()
            }
          });

          break;
      }
    }

    parsed[key] = content;
  }
  return parsed;

}


function process() {

  preprocessReferences(`

  @incollection{Woods81,
 author =      "Woods, W.A.",
 title =       "Procedural semantics as a theory of meaning",
 booktitle =   "Elements of Discourse Understanding",
 editor =      "Joshi, A.K. and Webber, B.L. and Sag, I.",
 publisher =   "Cambridge University Press",
 address =     "Cambridge, UK",
 year =        1981,
 pages =       "300--334"
}

@article{csikszentmihalyi199916,
  title={16 Implications of a Systems Perspective for the Study of Creativity},
  author={Csikszentmihalyi, Mihaly},
  journal={Handbook of creativity},
  volume={313},
  year={1999},
  publisher={Cambridge Univ Pr}
}@book{gauntlett2013making,
  title={Making is connecting},
  author={Gauntlett, David},
  year={2013},
  publisher={John Wiley \& Sons}
}

@article{bannon2012design,
  title={Design matters in participatory design},
  author={Bannon, Liam J and Ehn, Pelle},
  journal={Routledge handbook of participatory design},
  pages={37--63},
  year={2012}
}

@article{westecott2013independent,
  title={Independent game development as craft},
  author={Westecott, Emma},
  journal={Loading… The Journal of the Canadian Game Studies Association},
  volume={7},
  number={11},
  pages={78--91},
  year={2013},
  publisher={Simon Fraser University}
}

@article{burke2014decade,
  title={Decade of game making for learning: From tools to communities},
  author={Burke, Quinn and Kafai, Yasmin B},
  journal={Handbook of digital games},
  pages={689--709},
  year={2014},
  publisher={John Wiley \& Sons Hoboken, NJ}
}

@article{golsteijn2014hybrid,
  title={Hybrid crafting: towards an integrated practice of crafting with physical and digital components},
  author={Golsteijn, Connie and Van Den Hoven, Elise and Frohlich, David and Sellen, Abigail},
  journal={Personal and ubiquitous computing},
  volume={18},
  number={3},
  pages={593--611},
  year={2014},
  publisher={Springer}
}

@article{lindgren2012took,
  title={‘It took me about half an hour, but I did it!’Media circuits and affinity spaces around how-to videos on YouTube},
  author={Lindgren, Simon},
  journal={European Journal of Communication},
  volume={27},
  number={2},
  pages={152--170},
  year={2012},
  publisher={Sage Publications Sage UK: London, England}
}
@inproceedings{grimme2014we,
  title={We've conquered dark: shedding light on empowerment in critical making},
  author={Grimme, Shannon and Bardzell, Jeffrey and Bardzell, Shaowen},
  booktitle={Proceedings of the 8th Nordic Conference on Human-Computer Interaction: Fun, Fast, Foundational},
  pages={431--440},
  year={2014},
  organization={ACM}
}
@article{friedhoff2013untangling,
  title={Untangling twine: A platform study},
  author={Friedhoff, Jane},
  journal={Proceedings of DiGRA 2013: DeFragging Game Studies},
  year={2013}
}

@article{mason2010visualizing,
  title={Visualizing Redundant Paths Through Hypertext Narratives},
  author={Mason, Stacey},
  year={2010}
}
@article{powley2016automated,
  title={Automated tweaking of levels for casual creation of mobile games},
  author={Powley, Edward and Gaudl, Swen and Colton, Simon and Nelson, Mark and Saunders, Rob and Cook, Michael},
  year={2016}
}

@inproceedings{patrascu2016artefacts,
  title={Artefacts: Minecraft meets collaborative interactive evolution},
  author={Patrascu, Cristinel and Risi, Sebastian},
  booktitle={Computational Intelligence and Games (CIG), 2016 IEEE Conference on},
  pages={1--8},
  year={2016},
  organization={IEEE}
}

@inproceedings{eigenfeldt2016flexible,
  title={Flexible Generation of Musical Form: Beyond Mere Generation},
  author={Eigenfeldt, Arne and Bown, Oliver and Brown, Andrew R and Gifford, Toby},
  booktitle={Proceedings of the Seventh International Conference on Computational Creativity},
  year={2016}
}

@inproceedings{eigenfeldt2016flexible,
  title={Flexible Generation of Musical Form: Beyond Mere Generation},
  author={Eigenfeldt, Arne and Bown, Oliver and Brown, Andrew R and Gifford, Toby},
  booktitle={Proceedings of the Seventh International Conference on Computational Creativity},
  year={2016}
}

@inproceedings{liapis2016boosting,
  title={Boosting computational creativity with human interaction in mixed-initiative co-creation tasks},
  author={Liapis, Antonios and Yannakakis, Georgios N},
  booktitle={Proceedings of the ICCC workshop on Computational Creativity and Games},
  year={2016}
}@inproceedings{samuel2016design,
  title={The Design of Writing Buddy: A Mixed-Initiative Approach Towards Computational Story Collaboration},
  author={Samuel, Ben and Mateas, Michael and Wardrip-Fruin, Noah},
  booktitle={Interactive Storytelling: 9th International Conference on Interactive Digital Storytelling, ICIDS 2016, Los Angeles, CA, USA, November 15--18, 2016, Proceedings 9},
  pages={388--396},
  year={2016},
  organization={Springer}
}

@article{ferrergamika,
  title={GAMIKA: ART BASED GAME DESIGN},
  author={Ferrer, Blanca P{\'e}rez and Colton, Simon and Powley, Edward and Krzywinska, Tanya and Geelhoed, Erik and Cook, Michael}
}

@inproceedings{cook2016towards,
  title={Towards the automatic optimisation of procedural content generators},
  author={Cook, Michael and Gow, Jeremy and Colton, Simon},
  booktitle={Computational Intelligence and Games (CIG), 2016 IEEE Conference on},
  pages={1--8},
  year={2016},
  organization={IEEE}
}
@article{colton2016towards,
  title={Towards a computational reading of emergence in experimental game design},
  author={Colton, Simon and Nelson, Mark and Saunders, Rob and Powley, Edward and Gaudl, Swen and Cook, Michael},
  year={2016}
}@inproceedings{ventura2016beyond,
  title={Beyond computational intelligence to computational creativity in games},
  author={Ventura, Dan},
  booktitle={Computational Intelligence and Games (CIG), 2016 IEEE Conference on},
  pages={1--8},
  year={2016},
  organization={IEEE}
}
@mastersthesis{smit2016meaningful,
  title={Meaningful Choice as Expression of Creativity in Gameplay: A Preliminary Typology of Creative Gameplay in Videogames},
  author={Smit, WS},
  year={2016}
}

@MISC{randomgen
  author =       {Orteil},
 month =        {March},
   year =         {2014},
  url = {http://orteil.dashnet.org/randomgen/},
}

@MISC{dzieza,
   author =       {Dzieza, Josh},
   title =        {The strange world of computer-generated novels},
   editor =       {The Verge},
   month =        {November},
   year =         {2014},
   url = {http://www.theverge.com/2014/11/25/7276157/nanogenmo-robot-author-novel},
   note =         {[posted 25-November-2014]},
 }
 @MISC{melzer,
   author =       {Melzer, Tom},
   title =        {Once upon a bot: can we teach computers to write fiction?},
   editor =       {The Guardian},
   month =        {November},
   year =         {2014},
   url = {http://www.theguardian.com/books/2014/nov/11/can-computers-write-fiction-artificial-intelligence},
   note =         {[posted 11-November-2014]},
 }
 
 
@MISC{neyfakh,
   author =       {Neyfakh, Leon},
   title =        {The botmaker who sees through the Internet},
   editor =       {The Boston Globe},
   month =        {January},
   year =         {2014},
   url = http://www.bostonglobe.com/ideas/2014/01/24/the-botmaker-who-sees-through-internet/V7Qn7HU8TPPl7MSM2TvbsJ/story.html,
   note =       {[posted 24-January-2014]},
 }
 
  
@MISC{howtobot,
   author =       {Kazemi, Darius},
   title =        {How to make a Twitter bot},
   editor =       {Tiny Subversions},
   month =        {January},
   year =         {2014},
   url = {http://tinysubversions.com/2013/09/how-to-make-a-twitter-bot/},
   note =         {[posted 30-September-2013]},
 }
   
@MISC{contentForever,
   author =       {Kazemi, Darius},
   title =        {Content, Forever: Behind the Scenes},
   editor =       {Tiny Subversions},
   month =        {December},
   year =         {2014},
   url =  {http://tinysubversions.com/contentForever/drafts.html},
   note =         {[posted 17-December-2014]},
 }
 
@MISC{appreciationbot,
   author =       {Cook, Michael},
   title =        {Quicker Bot: @AppreciationBot},
   editor =       {Games By Angelina},
   month =        {May},
   year =         {2014},
   url =  {http://www.gamesbyangelina.org/2014/05/quicker-bot-appreciationbot/},
   note =         {[posted 20-May-2014]},
 }
 @MISC{closedBots,
 author = {Sample, Mark},
 title ={Closed Bots and Green Bots: Two Archetypes of Computational Media},
 editor={Sample Reality},
 month={June},
 year={2014},
 url={http://www.samplereality.com/2014/06/23/closed-bots-and-green-bots/},
 note={[posted 23-June-2014]},
 }
 

 @MISC{howtobot,
   author =       {Kazemi, Darius},
   title =        {How to make a Twitter bot},
   editor =       {Tiny Subversions},
   month =        {January},
   year =         {2014},
   url = {http://tinysubversions.com/2013/09/how-to-make-a-twitter-bot/},
   note =         {[posted 30-September-2013]},
 }
 
 @MISC{rps,
   author =       {Warr, Philippa},
   title =        {Welcome To Eternal Night Vale},
   editor =       {Rock, Paper, Shotgun},
   month =        {November},
   year =         {2014},
   url = {http://www.rockpapershotgun.com/2014/11/19/eternal-night-vale/},
   note =         {[posted 19-November-2014]},
 }
 
  @MISC{interruption,
   author =       {Kiai, Deirdre "Squinky"},
   title =        {New game: Interruption Junction},
   editor =       {squinky.me},
   month =        {January},
   year =         {2015},
   url = {http://squinky.me/2015/01/19/new-game-interruption-junction/},
   note =         {[posted 19-January-2015]},
 }
 
  @article{friedhoff2013untangling,
  title={Untangling twine: A platform study},
  author={Friedhoff, Jane},
  journal={Proceedings of DiGRA 2013: DeFragging Game Studies},
  year={2013}
}

  @MISC{twineMacros,
   author =       {Turner, Emanuel},
   title =        {How to Create Custom Macros in Twine},
   editor =       {eturnerx},
   month =        {December},
   year =         {2012},
   url = {http://eturnerx.blogspot.com/2012/12/how-to-create-custom-macros-in-twine.html},
   note =         {[posted 14-December-2012]},
 }
 
 @article{perez2001mexica,
  title={MEXICA: A computer model of a cognitive account of creative writing},
  author={P{\'E}rez, Rafael P{\'E}rez {\'Y} and Sharples, Mike},
  journal={Journal of Experimental \& Theoretical Artificial Intelligence},
  volume={13},
  number={2},
  pages={119--139},
  year={2001},
  publisher={Taylor \& Francis}
}
@article{weizenbaum1966eliza,
  title={ELIZA?a computer program for the study of natural language communication between man and machine},
  author={Weizenbaum, Joseph},
  journal={Communications of the ACM},
  volume={9},
  number={1},
  pages={36--45},
  year={1966},
  publisher={ACM}
}
 
 @inproceedings{petrovic2013unsupervised,
  title={Unsupervised joke generation from big data.},
  author={Petrovic, Sasa and Matthews, David},
  booktitle={ACL (2)},
  pages={228--232},
  year={2013}
}

 @article{montfort2008integrating,
  title={Integrating a plot generator and an automatic narrator to create and tell stories},
  author={Montfort, Nick and Perez y Perez, RP},
  journal={On Computational Creativity},
  year={2008}
}

@article{riedl2012interactive,
  title={Interactive narrative: An intelligent systems approach},
  author={Riedl, Mark Owen and Bulitko, Vadim},
  journal={AI Magazine},
  volume={34},
  number={1},
  pages={67},
  year={2012}
}

@inproceedings{mccoy2010authoring,
  title={Authoring game-based interactive narrative using social games and comme il faut},
  author={McCoy, Josh and Treanor, Mike and Samuel, Ben and Tearse, Brandon and Mateas, Michael and Wardrip-Fruin, Noah},
  booktitle={Proceedings of the 4th International Conference \& Festival of the Electronic Literature Organization: Archive \& Innovate},
  year={2010}
}

  @MISC{whatsaid-emshort,
   author =       {Short, Emily},
   title =        {What people said about the Missing Tools (and some that aren?t missing at all)},
   editor =       {Emily Short's Interactive Storytelling},
   month =        {March},
   year =         {2014},
   url = {https://emshort.wordpress.com/2014/03/29/what-people-said-about-the-missing-tools-and-some-that-arent-missing-at-all/},
   note =         {[posted 29-March-2014]},
 }
  
  @MISC{procedural-emshort,
   author =       {Short, Emily},
   title =        {Procedural Text Generation in IF},
   editor =       {Emily Short's Interactive Storytelling},
   month =        {November},
   year =         {2014},
   url = {https://emshort.wordpress.com/2014/11/18/procedural-text-generation-in-if/},
   note =         {[posted 18-November-2014]},
 }
 
 @article{short2011npc,
  title={NPC conversation systems},
  author={Short, Emily},
  journal={IF Theory Reader},
  pages={331},
  year={2011}
}
@article{icebound,
  title={Author assistance visualizations for ice-bound, a combinatorial narrative},
  author={Garbe, Jacob and Reed, A and Dickinson, Melanie and Mateas, M and Wardrip-Fruin, N},
  journal={Foundations of Digital Games},
  year={2014}
}
 
@article{makingfriends,
  title={Making projects, making friends: Online community as catalyst for interactive media creation},
  author={Brennan, Karen and Monroy-Hern{\'a}ndez, Andr{\'e}s and Resnick, Mitchel},
  journal={New directions for youth development},
  volume={2010},
  number={128},
  pages={75--83},
  year={2010},
  publisher={Wiley Online Library}
}

@InProceedings{whatif,
  Title                    = {Towards the Automatic Generation of Fictional Ideas for Games},
  Author                   = {Maria Teresa Llano Rodriguez and Simon Colton and Rose Hepworth and Michael Cook and Christian Guckelsberger},
  Booktitle                = {AAAI Workshop on Experimental AI in Games},
  Year                     = {2014},

  Owner                    = {ben},
  Timestamp                = {2014.12.10}
}

@article{rodley2014art,
  title={On the Art of Writing with Data},
  author={Rodley, Chris and Burrell, Andrew},
  journal={The Future of Writing},
  pages={77},
  year={2014},
  publisher={Palgrave Macmillan}
}

@inproceedings{zhu2010story,
  title={Story representation in analogy-based story generation in riu},
  author={Zhu, Jichen and Ontan{\'o}n, Santiago},
  booktitle={Computational Intelligence and Games (CIG), 2010 IEEE Symposium on},
  pages={435--442},
  year={2010},
  organization={IEEE}
}

@inproceedings{harrell2006walking,
  title={Walking blues changes undersea: Imaginative narrative in interactive poetry generation with the griot system},
  author={Harrell, D Fox},
  booktitle={AAAI 2006 Workshop in Computational Aesthetics: Artificial Intelligence Approaches to Happiness and Beauty},
  pages={61--69},
  year={2006}
}

@incollection{karhulahti2012suspending,
  title={Suspending virtual disbelief: a perspective on narrative coherence},
  author={Karhulahti, Veli-Matti},
  booktitle={Interactive Storytelling},
  pages={1--17},
  year={2012},
  publisher={Springer}
}

@article{resnick2005design,
  title={Design principles for tools to support creative thinking},
  author={Resnick, Mitchel and Myers, Brad and Nakakoji, Kumiyo and Shneiderman, Ben and Pausch, Randy and Selker, Ted and Eisenberg, Mike},
  year={2005}
}

@article{shneiderman2006creativity,
  title={Creativity support tools: Report from a US National Science Foundation sponsored workshop},
  author={Shneiderman, Ben and Fischer, Gerhard and Czerwinski, Mary and Resnick, Mitch and Myers, Brad and Candy, Linda and Edmonds, Ernest and Eisenberg, Mike and Giaccardi, Elisa and Hewett, Tom and others},
  journal={International Journal of Human-Computer Interaction},
  volume={20},
  number={2},
  pages={61--77},
  year={2006},
  publisher={Taylor \& Francis}
}

@article{shneiderman2007creativity,
  title={Creativity support tools: Accelerating discovery and innovation},
  author={Shneiderman, Ben},
  journal={Communications of the ACM},
  volume={50},
  number={12},
  pages={20--32},
  year={2007},
  publisher={ACM}
}



@article{shneiderman19931,
  title={1.1 direct manipulation: a step beyond programming languages},
  author={Shneiderman, Ben},
  journal={Sparks of innovation in human-computer interaction},
  volume={17},
  pages={1993},
  year={1993}
}

@article{lastowka2011minecraft,
  title={Minecraft as web 2.0: Amateur creativity \& digital games},
  author={Lastowka, Greg},
  journal={Available at SSRN 1939241},
  year={2011}
}

@inproceedings{montfort2013slant,
  title={Slant: A blackboard system to generate plot, figuration, and narrative discourse aspects of stories},
  author={Montfort, Nick and P{\'e}rez, Rafael and Harrell, D Fox and Campana, Andrew},
  booktitle={Proceedings of the Fourth International Conference on Computational Creativity},
  pages={168--175},
  year={2013}
}

@misc{randomgen,
author = {Orteil},
  title = {RandomGen},
  howpublished = {http://orteil.dashnet.org/randomgen/},
  note = {Accessed: 2015-02-14}
}


@inproceedings{zhu2012towards,
  title={Towards a mixed evaluation approach for computational narrative systems},
  author={Zhu, Jichen},
  booktitle={International Conference on Computational Creativity},
  pages={150},
  year={2012},
  organization={Citeseer}
}




@inproceedings{valls2014toward,
  title={Toward automatic character identification in unannotated narrative text},
  author={Valls-Vargas, Josep and Onta{\~n}{\'o}n, Santiago and Zhu, Jichen},
  booktitle={Seventh Intelligent Narrative Technologies Workshop},
  year={2014}
}

@article{black1979evaluation,
  title={An Evaluation of Story Grammars*},
  author={Black, John B and Wilensky, Robert},
  journal={Cognitive Science},
  volume={3},
  number={3},
  pages={213--229},
  year={1979},
  publisher={Wiley Online Library}
}

@inproceedings{compton2014tracery,
  title={Tracery: Approachable Story Grammar Authoring for Casual Users},
  author={Compton, Kate and Filstrup, Benjamin and Mateas, Michae and others},
  booktitle={Seventh Intelligent Narrative Technologies Workshop},
  year={2014}
}


@article{rumelhart1980evaluating,
  title={On Evaluating Story Grammars*},
  author={Rumelhart, David E},
  journal={Cognitive Science},
  volume={4},
  number={3},
  pages={313--316},
  year={1980},
  publisher={Wiley Online Library}
}



@MISC{dzieza,
   author =       {Dzieza, Josh},
   title =        {The strange world of computer-generated novels},
   editor =       {The Verge},
   month =        {November},
   year =         {2014},
   url = {http://www.theverge.com/2014/11/25/7276157/nanogenmo-robot-author-novel},
   note =         {[posted 25-November-2014]},
 }
 
 
@MISC{neyfakh,
   author =       {Neyfakh, Leon},
   title =        {The botmaker who sees through the Internet},
   editor =       {The Boston Globe},
   month =        {January},
   year =         {2014},
   url = http://www.bostonglobe.com/ideas/2014/01/24/the-botmaker-who-sees-through-internet/V7Qn7HU8TPPl7MSM2TvbsJ/story.html,
   note =       {[posted 24-January-2014]},
 }
 
  
@MISC{howtobot,
   author =       {Kazemi, Darius},
   title =        {How to make a Twitter bot},
   editor =       {Tiny Subversions},
   month =        {January},
   year =         {2014},
   url = {http://tinysubversions.com/2013/09/how-to-make-a-twitter-bot/},
   note =         {[posted 30-September-2013]},
 }
   
@MISC{contentForever,
   author =       {Kazemi, Darius},
   title =        {Content, Forever: Behind the Scenes},
   editor =       {Tiny Subversions},
   month =        {December},
   year =         {2014},
   url =  {http://tinysubversions.com/contentForever/drafts.html},
   note =         {[posted 17-December-2014]},
 }
 
@MISC{appreciationbot,
   author =       {Cook, Michael},
   title =        {Quicker Bot: @AppreciationBot},
   editor =       {Games By Angelina},
   month =        {May},
   year =         {2014},
   url =  {http://www.gamesbyangelina.org/2014/05/quicker-bot-appreciationbot/},
   note =         {[posted 20-May-2014]},
 }
 @MISC{closedBots,
 author = {Sample, Mark},
 title ={Closed Bots and Green Bots: Two Archetypes of Computational Media},
 editor={Sample Reality},
 month={June},
 year={2014},
 url={http://www.samplereality.com/2014/06/23/closed-bots-and-green-bots/},
 note={[posted 23-June-2014]},
 }
 

 @MISC{howtobot,
   author =       {Kazemi, Darius},
   title =        {How to make a Twitter bot},
   editor =       {Tiny Subversions},
   month =        {January},
   year =         {2014},
   url = {http://tinysubversions.com/2013/09/how-to-make-a-twitter-bot/},
   note =         {[posted 30-September-2013]},
 }
 
 @MISC{rps,
   author =       {Warr, Philippa},
   title =        {Welcome To Eternal Night Vale},
   editor =       {Rock, Paper, Shotgun},
   month =        {November},
   year =         {2014},
   url = {http://www.rockpapershotgun.com/2014/11/19/eternal-night-vale/},
   note =         {[posted 19-November-2014]},
 }
 
  @MISC{interruption,
   author =       {Kiai, Deirdre "Squinky"},
   title =        {New game: Interruption Junction},
   editor =       {squinky.me},
   month =        {January},
   year =         {2015},
   url = {http://squinky.me/2015/01/19/new-game-interruption-junction/},
   note =         {[posted 19-January-2015]},
 }
 
  @article{friedhoff2013untangling,
  title={Untangling twine: A platform study},
  author={Friedhoff, Jane},
  journal={Proceedings of DiGRA 2013: DeFragging Game Studies},
  year={2013}
}

  @MISC{twineMacros,
   author =       {Turner, Emanuel},
   title =        {How to Create Custom Macros in Twine},
   editor =       {eturnerx},
   month =        {December},
   year =         {2012},
   url = {http://eturnerx.blogspot.com/2012/12/how-to-create-custom-macros-in-twine.html},
   note =         {[posted 14-December-2012]},
 }
 
 @article{perez2001mexica,
  title={MEXICA: A computer model of a cognitive account of creative writing},
  author={P{\'E}rez, Rafael P{\'E}rez {\'Y} and Sharples, Mike},
  journal={Journal of Experimental \& Theoretical Artificial Intelligence},
  volume={13},
  number={2},
  pages={119--139},
  year={2001},
  publisher={Taylor \& Francis}
}
@article{weizenbaum1966eliza,
  title={ELIZA?a computer program for the study of natural language communication between man and machine},
  author={Weizenbaum, Joseph},
  journal={Communications of the ACM},
  volume={9},
  number={1},
  pages={36--45},
  year={1966},
  publisher={ACM}
}
 
 @inproceedings{petrovic2013unsupervised,
  title={Unsupervised joke generation from big data.},
  author={Petrovic, Sasa and Matthews, David},
  booktitle={ACL (2)},
  pages={228--232},
  year={2013}
}

 @article{montfort2008integrating,
  title={Integrating a plot generator and an automatic narrator to create and tell stories},
  author={Montfort, Nick and Perez y Perez, RP},
  journal={On Computational Creativity},
  year={2008}
}

@article{riedl2012interactive,
  title={Interactive narrative: An intelligent systems approach},
  author={Riedl, Mark Owen and Bulitko, Vadim},
  journal={AI Magazine},
  volume={34},
  number={1},
  pages={67},
  year={2012}
}

@inproceedings{mccoy2010authoring,
  title={Authoring game-based interactive narrative using social games and comme il faut},
  author={McCoy, Josh and Treanor, Mike and Samuel, Ben and Tearse, Brandon and Mateas, Michael and Wardrip-Fruin, Noah},
  booktitle={Proceedings of the 4th International Conference \& Festival of the Electronic Literature Organization: Archive \& Innovate},
  year={2010}
}

  @MISC{whatsaid-emshort,
   author =       {Short, Emily},
   title =        {What people said about the Missing Tools (and some that aren?t missing at all)},
   editor =       {Emily Short's Interactive Storytelling},
   month =        {March},
   year =         {2014},
   url = {https://emshort.wordpress.com/2014/03/29/what-people-said-about-the-missing-tools-and-some-that-arent-missing-at-all/},
   note =         {[posted 29-March-2014]},
 }
  
  @MISC{procedural-emshort,
   author =       {Short, Emily},
   title =        {Procedural Text Generation in IF},
   editor =       {Emily Short's Interactive Storytelling},
   month =        {November},
   year =         {2014},
   url = {https://emshort.wordpress.com/2014/11/18/procedural-text-generation-in-if/},
   note =         {[posted 18-November-2014]},
 }
 
 @article{short2011npc,
  title={NPC conversation systems},
  author={Short, Emily},
  journal={IF Theory Reader},
  pages={331},
  year={2011}
}
@article{icebound,
  title={Author assistance visualizations for ice-bound, a combinatorial narrative},
  author={Garbe, Jacob and Reed, A and Dickinson, Melanie and Mateas, M and Wardrip-Fruin, N},
  journal={Foundations of Digital Games},
  year={2014}
}
 
@article{makingfriends,
  title={Making projects, making friends: Online community as catalyst for interactive media creation},
  author={Brennan, Karen and Monroy-Hern{\'a}ndez, Andr{\'e}s and Resnick, Mitchel},
  journal={New directions for youth development},
  volume={2010},
  number={128},
  pages={75--83},
  year={2010},
  publisher={Wiley Online Library}
}

@InProceedings{whatif,
  Title                    = {Towards the Automatic Generation of Fictional Ideas for Games},
  Author                   = {Maria Teresa Llano Rodriguez and Simon Colton and Rose Hepworth and Michael Cook and Christian Guckelsberger},
  Booktitle                = {AAAI Workshop on Experimental AI in Games},
  Year                     = {2014},

  Owner                    = {ben},
  Timestamp                = {2014.12.10}
}

@article{rodley2014art,
  title={On the Art of Writing with Data},
  author={Rodley, Chris and Burrell, Andrew},
  journal={The Future of Writing},
  pages={77},
  year={2014},
  publisher={Palgrave Macmillan}
}

@inproceedings{zhu2010story,
  title={Story representation in analogy-based story generation in riu},
  author={Zhu, Jichen and Ontan{\'o}n, Santiago},
  booktitle={Computational Intelligence and Games (CIG), 2010 IEEE Symposium on},
  pages={435--442},
  year={2010},
  organization={IEEE}
}

@inproceedings{harrell2006walking,
  title={Walking blues changes undersea: Imaginative narrative in interactive poetry generation with the griot system},
  author={Harrell, D Fox},
  booktitle={AAAI 2006 Workshop in Computational Aesthetics: Artificial Intelligence Approaches to Happiness and Beauty},
  pages={61--69},
  year={2006}
}

@incollection{karhulahti2012suspending,
  title={Suspending virtual disbelief: a perspective on narrative coherence},
  author={Karhulahti, Veli-Matti},
  booktitle={Interactive Storytelling},
  pages={1--17},
  year={2012},
  publisher={Springer}
}

@article{resnick2005design,
  title={Design principles for tools to support creative thinking},
  journal={In Proceedings of the NSF Workshop on Creativity Support Tools},
  author={Resnick, Mitchel and Myers, Brad and Nakakoji, Kumiyo and Shneiderman, Ben and Pausch, Randy and Selker, Ted and Eisenberg, Mike},
  year={2005}
}

@article{shneiderman2006creativity,
  title={Creativity support tools: Report from a US National Science Foundation sponsored workshop},
  author={Shneiderman, Ben and Fischer, Gerhard and Czerwinski, Mary and Resnick, Mitch and Myers, Brad and Candy, Linda and Edmonds, Ernest and Eisenberg, Mike and Giaccardi, Elisa and Hewett, Tom and others},
  journal={International Journal of Human-Computer Interaction},
  volume={20},
  number={2},
  pages={61--77},
  year={2006},
  publisher={Taylor \& Francis}
}

@article{shneiderman2007creativity,
  title={Creativity support tools: Accelerating discovery and innovation},
  author={Shneiderman, Ben},
  journal={Communications of the ACM},
  volume={50},
  number={12},
  pages={20--32},
  year={2007},
  publisher={ACM}
}



@article{shneiderman19931,
  title={1.1 direct manipulation: a step beyond programming languages},
  author={Shneiderman, Ben},
  journal={Sparks of innovation in human-computer interaction},
  volume={17},
  pages={1993},
  year={1993}
}

@article{lastowka2011minecraft,
  title={Minecraft as web 2.0: Amateur creativity \& digital games},
  author={Lastowka, Greg},
  journal={Available at SSRN 1939241},
  year={2011}
}

@inproceedings{montfort2013slant,
  title={Slant: A blackboard system to generate plot, figuration, and narrative discourse aspects of stories},
  author={Montfort, Nick and P{\'e}rez, Rafael and Harrell, D Fox and Campana, Andrew},
  booktitle={Proceedings of the Fourth International Conference on Computational Creativity},
  pages={168--175},
  year={2013}
}
@misc{randomgen,
author = {Orteil},
  title = {RandomGen},
  howpublished = {http://orteil.dashnet.org/randomgen/},
  note = {Accessed: 2015-02-14}
}


@inproceedings{zhu2012towards,
  title={Towards a mixed evaluation approach for computational narrative systems},
  author={Zhu, Jichen},
  booktitle={International Conference on Computational Creativity},
  pages={150},
  year={2012},
  organization={Citeseer}
}


@inproceedings{compton2014tracery,
  title={Tracery: Approachable Story Grammar Authoring for Casual Users},
  author={Compton, Kate and Filstrup, Benjamin and Mateas, Michae and others},
  booktitle={Seventh Intelligent Narrative Technologies Workshop},
  year={2014}
}


@article{rumelhart1980evaluating,
  title={On Evaluating Story Grammars*},
  author={Rumelhart, David E},
  journal={Cognitive Science},
  volume={4},
  number={3},
  pages={313--316},
  year={1980},
  publisher={Wiley Online Library}
}

@inproceedings{valls2014toward,
  title={Toward automatic character identification in unannotated narrative text},
  author={Valls-Vargas, Josep and Onta{\~n}{\'o}n, Santiago and Zhu, Jichen},
  booktitle={Seventh Intelligent Narrative Technologies Workshop},
  year={2014}
}




@article{plucker1999psychometric,
  title={Psychometric approaches to the study of human creativity},
  author={Plucker, Jonathan A and Renzulli, Joseph S},
  journal={Handbook of creativity},
  pages={35--61},
  year={1999}
}

@article{plucker2010assessment,
  title={Assessment of creativity},
  author={Plucker, Jonathan A and Makel, Matthew C},
  journal={The Cambridge handbook of creativity},
  pages={48--73},
  year={2010},
  publisher={Cambridge University Press New York, NY}
}

@article{garbeauthor,
  title={Author Assistance Visualizations for Ice-Bound, A Combinatorial Narrative},
  author={Garbe, Jacob and Reed, Aaron A and Dickinson, Melanie and Wardrip-Fruin, Noah and Mateas, Michael},
   journal={Foundations of Digital Games. FDG},
  year={2014}
}

@book{tan2007creativity,
  title={Creativity: A handbook for teachers},
  author={Tan, Ai-Girl},
  year={2007},
  publisher={World Scientific}
}

@book{michalko2010thinkertoys,
  title={Thinkertoys: A handbook of creative-thinking techniques},
  author={Michalko, Michael},
  year={2010},
  publisher={Random House LLC}
}

@book{shneiderman2003leonardo,
  title={Leonardo's laptop: human needs and the new computing technologies},
  author={Shneiderman, Ben},
  year={2003},
  publisher={Mit Press}
}

@inproceedings{risi2012combining,
  title={Combining Search-Based Procedural Content Generation and Social Gaming in the Petalz Video Game.},
  author={Risi, Sebastian and Lehman, Joel and D'Ambrosio, David B and Hall, Ryan and Stanley, Kenneth O},
  booktitle={AIIDE},
  year={2012}
}

@article{liu2000creativity,
  title={Creativity or novelty?: Cognitive-computational versus social-cultural},
  author={Liu, Yu-Tung},
  journal={Design Studies},
  volume={21},
  number={3},
  pages={261--276},
  year={2000},
  publisher={Elsevier}
}

@article{fitzpatrick1988genetic,
  title={Genetic algorithms in noisy environments},
  author={Fitzpatrick, J Michael and Grefenstette, John J},
  journal={Machine learning},
  volume={3},
  number={2-3},
  pages={101--120},
  year={1988},
  publisher={Springer}
}

@inproceedings{horvitz1999principles,
  title={Principles of mixed-initiative user interfaces},
  author={Horvitz, Eric},
  booktitle={Proceedings of the SIGCHI conference on Human Factors in Computing Systems},
  pages={159--166},
  year={1999},
  organization={ACM}
}

@article{hutchins1985direct,
  title={Direct manipulation interfaces},
  author={Hutchins, Edwin L and Hollan, James D and Norman, Donald A},
  journal={Human--Computer Interaction},
  volume={1},
  number={4},
  pages={311--338},
  year={1985},
  publisher={Taylor & Francis}
}

@book{zeisel2004eva,
  title={Eva Zeisel on Design},
  author={Zeisel, Eva},
  year={2004},
  publisher={Overlook Press}
}

@inproceedings{sutherland1964sketch,
  title={Sketch pad a man-machine graphical communication system},
  author={Sutherland, Ivan E},
  booktitle={Proceedings of the SHARE design automation workshop},
  pages={6--329},
  year={1964},
  organization={ACM}
}

@article{chen2006generative,
  title={A generative sketch model for human hair analysis and synthesis},
  author={Chen, Hong and Zhu, Song-Chun},
  journal={Pattern Analysis and Machine Intelligence, IEEE Transactions on},
  volume={28},
  number={7},
  pages={1025--1040},
  year={2006},
  publisher={IEEE}
}

@inproceedings{smelik2010interactive,
  title={Interactive creation of virtual worlds using procedural sketching},
  author={Smelik, Ruben M and Tutenel, Tim and de Kraker, Klaas Jan and Bidarra, Rafael},
  booktitle={Proceedings of eurographics},
  year={2010}
}

@inproceedings{smith2010tanagra,
  title={Tanagra: A mixed-initiative level design tool},
  author={Smith, Gillian and Whitehead, Jim and Mateas, Michael},
  booktitle={Proceedings of the Fifth International Conference on the Foundations of Digital Games},
  pages={209--216},
  year={2010},
  organization={ACM}
}

@ONLINE{willwright,
  author = {Baker, Chris},
  title = {Will Wright Wants to Make a Game Out of Life Itself},
   editor =       {wired.com},
  month = July,
  year = {2012},
  url = {http://www.wired.com/2012/07/mf_iconswright/}
}


@ONLINE{mostcreativepeople,
  author = {Fast Company Staff},
  title = {100 Most Creative People in Business 2013},
   editor =       {fastcompany.com},
  month = July,
  year = {2013},
  url = {http://www.fastcompany.com/section/most-creative-people-2013}
}


@ONLINE{mostcreativemanufacturer,
  author = {Dean, Josh},
  title = {Is This the World's Most Creative Manufacturer?},
   editor =       {inc.com},
  month = October,
  year = {2013},
  url = {http://www.fastcompany.com/section/most-creative-people-2013}
}

@article{reynolds2000managing,
  title={Managing depression through needlecraft creative activities: A qualitative study},
  author={Reynolds, Frances},
  journal={The Arts in Psychotherapy},
  volume={27},
  number={2},
  pages={107--114},
  year={2000}
}


@book{ruskinstones,
  title={The Stones of Venice, Volume III the Fall},
  author={Ruskin, John},
  year={1853},
  publisher={Cosimo, Inc.}
}

@book{morris1919useful,
  title={Useful work versus useless toil},
  author={Morris, William},
  year={1919},
  publisher={Charles H. Kerr & Company}
}

@article{rosser2007impact,
  title={The impact of video games on training surgeons in the 21st century},
  author={Rosser, James C and Lynch, Paul J and Cuddihy, Laurie and Gentile, Douglas A and Klonsky, Jonathan and Merrell, Ronald},
  journal={Archives of Surgery},
  volume={142},
  number={2},
  pages={181--186},
  year={2007},
  publisher={American Medical Association}
}


@article{baas2008meta,
  title={A meta-analysis of 25 years of mood-creativity research: Hedonic tone, activation, or regulatory focus?},
  author={Baas, Matthijs and De Dreu, Carsten KW and Nijstad, Bernard A},
  journal={Psychological bulletin},
  volume={134},
  number={6},
  pages={779},
  year={2008},
  publisher={American Psychological Association}
}

@article{fisher2000successful,
  title={Successful aging and creativity in later life},
  author={Fisher, Bradley J and Specht, Diana K},
  journal={Journal of Aging Studies},
  volume={13},
  number={4},
  pages={457--472},
  year={2000},
  publisher={Elsevier}
}

@article{kearney2005cognitive,
  title={Cognitive Callisthenics: Do FPS computer games enhance the player’s cognitive abilities?},
  author={Kearney, Paul},
  year={2005}
}
@article{batey2006creativity,
  title={Creativity, intelligence, and personality: A critical review of the scattered literature},
  author={Batey, Mark and Furnham, Adrian},
  journal={Genetic, Social, and General Psychology Monographs},
  volume={132},
  number={4},
  pages={355--429},
  year={2006},
  publisher={Taylor \& Francis}
}
@book{flow,
  title={Flow: The psychology of optimal experience},
  author={Csikszentmihalyi, Mihaly},
  volume={41},
  year={1991},
  publisher={HarperPerennial New York}
}

@inproceedings{tognazzini1993principles,
  title={Principles, techniques, and ethics of stage magic and their application to human interface design},
  author={Tognazzini, Bruce},
  booktitle={Proceedings of the INTERACT'93 and CHI'93 Conference on Human Factors in Computing Systems},
  pages={355--362},
  year={1993},
  organization={ACM}
}



@article{togelius2011search,
  title={Search-based procedural content generation: A taxonomy and survey},
  author={Togelius, Julian and Yannakakis, Georgios N and Stanley, Kenneth O and Browne, Cameron},
  journal={Computational Intelligence and AI in Games, IEEE Transactions on},
  volume={3},
  number={3},
  pages={172--186},
  year={2011},
  publisher={IEEE}
}

@inproceedings{dormans2010adventures,
  title={Adventures in level design: generating missions and spaces for action adventure games},
  author={Dormans, Joris},
  booktitle={Proceedings of the 2010 workshop on procedural content generation in games},
  pages={1},
  year={2010},
  organization={ACM}
}

@inproceedings{generativemethods,
  title={Generative methods},
  author={Compton, Kate and Osborn, Joseph C and Mateas, Michael},
  booktitle={The Fourth Procedural Content Generation in Games workshop, PCG},
  year={2013}
}

@inproceedings{yannakakis2014mixed,
  title={Mixed-initiative co-creativity},
  author={Yannakakis, Georgios N and Liapis, Antonios and Alexopoulos, Constantine and Togelius, Julian and Nelson, Mark J and Liapis, Antonios and Liapis, Antonios and Yannakakis, Georgios N and Togelius, Julian and Liapis, Antonios and others},
  booktitle={Proceedings of the ACM Conference on Foundations of Digital Games},
  year={2014}
}

@article{bedwe,
  title={We are all future creatives: Awakening the creative seed in our Social Studies garden},
  author={Bedwe, Jonathan Marshall}
}

@book{bruner,
  title={On knowing: Essays for the left hand},
  author={Bruner, Jerome Seymour},
  year={1979},
  publisher={Harvard University Press}
}

@article{conceptofcreativity,
  title={The concept of creativity: Prospects and paradigms},
  author={Sternberg, Robert J and Lubart, Todd I},
  journal={Handbook of creativity},
  volume={1},
  pages={3--15},
  year={1999}
}
@book{makingisconnecting,
  title={Making is connecting},
  author={Gauntlett, David},
  year={2013},
  publisher={John Wiley \& Sons}
}

@article{jenova,
  title={Flow in games (and everything else)},
  author={Chen, Jenova},
  journal={Communications of the ACM},
  volume={50},
  number={4},
  pages={31--34},
  year={2007},
  publisher={ACM}
}

@article{plucker2004,
  title={Why isn't creativity more important to educational psychologists? Potentials, pitfalls, and future directions in creativity research},
  author={Plucker, Jonathan A and Beghetto, Ronald A and Dow, Gayle T},
  journal={Educational Psychologist},
  volume={39},
  number={2},
  pages={83--96},
  year={2004},
  publisher={Taylor \& Francis}
}

@article{boden199918,
  title={18 Computer Models of Creativity},
  author={Boden, Margaret A},
  journal={Handbook of creativity},
  pages={351},
  year={1999},
  publisher={Cambridge University Press}
}

@article{kaufman2009beyond,
  title={Beyond big and little: The four c model of creativity.},
  author={Kaufman, James C and Beghetto, Ronald A},
  journal={Review of General Psychology},
  volume={13},
  number={1},
  pages={1},
  year={2009},
  publisher={Educational Publishing Foundation}
}

@article{shneiderman2000creating,
  title={Creating creativity: user interfaces for supporting innovation},
  author={Shneiderman, Ben},
  journal={ACM Transactions on Computer-Human Interaction (TOCHI)},
  volume={7},
  number={1},
  pages={114--138},
  year={2000},
  publisher={ACM}
}


@book{hobbies,
  title={Hobbies: Leisure and the culture of work in America},
  author={Gelber, Steven M},
  year={2013},
  publisher={Columbia University Press}
}
@article{resnick2005design,
  title={Design principles for tools to support creative thinking},
  author={Resnick, Mitchel and Myers, Brad and Nakakoji, Kumiyo and Shneiderman, Ben and Pausch, Randy and Selker, Ted and Eisenberg, Mike},
  year={2005}
}

@article{creativitysupporttools,
  title={Creativity support tools: accelerating discovery and innovation},
  author={Shneiderman, Ben},
  journal={Communications of the ACM},
  volume={50},
  number={12},
  pages={20--32},
  year={2007},
  publisher={ACM}
}

@article{saunders2004curious,
  title={Curious agents and situated design evaluations},
  author={Saunders, Rob and Gero, John S},
  journal={AI EDAM: Artificial Intelligence for Engineering Design, Analysis and Manufacturing},
  volume={18},
  number={02},
  pages={153--161},
  year={2004},
  publisher={Cambridge Univ Press}
}

@inproceedings{picard2005evaluating,
  title={Evaluating affective interactions: Alternatives to asking what users feel},
  author={Picard, Rosalind W and Daily, Shaundra Bryant},
  booktitle={CHI Workshop on Evaluating Affective Interfaces: Innovative Approaches},
  pages={2119--2122},
  year={2005}
}
@inproceedings{saunders2001digital,
  title={The digital clockwork muse: A computational model of aesthetic evolution},
  author={Saunders, Rob and Gero, John S},
  booktitle={Proceedings of the AISB},
  volume={1},
  pages={12--21},
  year={2001}
}

@inproceedings{dahlskog2009mapping,
  title={Mapping the game landscape: Locating genres using functional classification},
  author={Dahlskog, Steve and Kamstrup, Andreas and Aarseth, Espen},
  year={2009},
  organization={DiGRA}
}

@inproceedings{chen2005generative,
  title={A generative model of human hair for hair sketching},
  author={Chen, Hong and Zhu, Song Chun},
  booktitle={Computer Vision and Pattern Recognition, 2005. CVPR 2005. IEEE Computer Society Conference on},
  volume={2},
  pages={74--81},
  year={2005},
  organization={IEEE}
}
@inproceedings{teddy,
  title={Teddy: a sketching interface for 3D freeform design},
  author={Igarashi, Takeo and Matsuoka, Satoshi and Tanaka, Hidehiko},
  booktitle={Acm siggraph 2007 courses},
  pages={21},
  year={2007},
  organization={ACM}
}

@article{creativity,
  title={Creativity: Flow and the Psychology of Discovery and Invention},
  author={Csikszentmihalyi, Mihaly},
  journal={HarperPerennial, New York},
  year={1997}
}

@article{AnEmpiricalExamination,
  title={An empirical examination of the value of creativity support systems on idea generation},
  author={Massetti, Brenda},
  journal={MIS quarterly},
  pages={83--97},
  year={1996},
  publisher={JSTOR}
}

@inproceedings{nacke2008flow,
  title={Flow and immersion in first-person shooters: measuring the player's gameplay experience},
  author={Nacke, Lennart and Lindley, Craig A},
  booktitle={Proceedings of the 2008 Conference on Future Play: Research, Play, Share},
  pages={81--88},
  year={2008},
  organization={ACM}
}

@article{musicalExpression,
  title={Evaluation of input devices for musical expression: Borrowing tools from HCI},
  author={Wanderley, Marcelo Mortensen and Orio, Nicola},
  journal={Computer Music Journal},
  volume={26},
  number={3},
  pages={62--76},
  year={2002},
  publisher={MIT Press}
}

@article{sternberg2007creativity,
  title={Creativity as a Habit},
  author={Sternberg, Robert},
  journal={Creativity: A handbook for teachers},
  pages={3--25},
  year={2007},
  publisher={Citeseer}
}

@book{beyondproductivity,
  title={Beyond Productivity:: Information, Technology, Innovation, and Creativity},
  author={Blumenthal, Marjory S and Inouye, Alan S and Mitchell, William J and others},
  year={2003},
  publisher={National Academies Press}
}

@article{adrion1982validation,
  title={Validation, verification, and testing of computer software},
  author={Adrion, W Richards and Branstad, Martha A and Cherniavsky, John C},
  journal={ACM Computing Surveys (CSUR)},
  volume={14},
  number={2},
  pages={159--192},
  year={1982},
  publisher={ACM}
}

@inproceedings{siggraph,
  title={Creating spherical worlds},
  author={Compton, Kate and Grieve, James and Goldman, Ed and Quigley, Ocean and Stratton, Christian and Todd, Eric and Willmott, Andrew},
  booktitle={ACM SIGGRAPH},
  pages={05--09},
  year={2007}
}

@incollection{fool,
  title={The painting fool: Stories from building an automated painter},
  author={Colton, Simon},
  booktitle={Computers and creativity},
  pages={3--38},
  year={2012},
  publisher={Springer}
}

@article{buildit,
  title={Build it to understand it: Ludology meets narratology in game design space},
  author={Mateas, Michael},
  year={2005}
}

@inproceedings{dahlskogPlatformPatterns,
  title={Patterns and procedural content generation: revisiting Mario in world 1 level 1},
  author={Dahlskog, Steve and Togelius, Julian},
  booktitle={Proceedings of the First Workshop on Design Patterns in Games},
  pages={1},
  year={2012},
  organization={ACM}
}

@inproceedings{consideredHarmful,
  title={Usability evaluation considered harmful (some of the time)},
  author={Greenberg, Saul and Buxton, Bill},
  booktitle={Proceedings of the SIGCHI Conference on Human Factors in Computing Systems},
  pages={111--120},
  year={2008},
  organization={ACM}
}

@article{lindley2003game,
  title={Game taxonomies: A high level framework for game analysis and design},
  author={Lindley, Craig A},
  journal={Gamasutra. URL: www. gamasutra. com/features/20031003/lindley\_01. shtml},
  year={2003}
}

@book{schell,
  title={The Art of Game Design: A book of lenses},
  author={Schell, Jesse},
  year={2008},
  publisher={CRC Press}
}

@inproceedings{digitalmuse,
  title={The digital clockwork muse: A computational model of aesthetic evolution},
  author={Saunders, Rob and Gero, John S},
  booktitle={Proceedings of the AISB},
  volume={1},
  pages={12--21},
  year={2001}
}
@article{designingForCreativeEngagement,
  title={Designing for creative engagement},
  author={Bilda, Zafer and Edmonds, Ernest and Candy, Linda},
  journal={Design Studies},
  volume={29},
  number={6},
  pages={525--540},
  year={2008},
  publisher={Elsevier}
}


@incollection{smith2011situating,
  title={Situating quests: design patterns for quest and level design in role-playing games},
  author={Smith, Gillian and Anderson, Ryan and Kopleck, Brian and Lindblad, Zach and Scott, Lauren and Wardell, Adam and Whitehead, Jim and Mateas, Michael},
  booktitle={Interactive Storytelling},
  pages={326--329},
  year={2011},
  publisher={Springer}
}
@inproceedings{howToStudyArtificialCreativity,
  title={How to study artificial creativity},
  author={Saunders, Rob and Gero, John S},
  booktitle={Proceedings of the 4th conference on Creativity \& cognition},
  pages={80--87},
  year={2002},
  organization={ACM}
}

@article{situatedagents,
  title={Curious agents and situated design evaluations},
  author={Saunders, Rob and Gero, John S},
  journal={AI EDAM: Artificial Intelligence for Engineering Design, Analysis and Manufacturing},
  volume={18},
  number={02},
  pages={153--161},
  year={2004},
  publisher={Cambridge Univ Press}
}

@inproceedings{hullett2010design,
  title={Design patterns in FPS levels},
  author={Hullett, Kenneth and Whitehead, Jim},
  booktitle={proceedings of the Fifth International Conference on the Foundations of Digital Games},
  pages={78--85},
  year={2010},
  organization={ACM}
}

@article{lessardgame,
  title={Game Genres and High-Level Design Pattern Formations},
  booktitle={Proceedings of the Design Patterns in Games workshop},
  year={2014},
  author={Lessard, Jonathan}
}

@inproceedings{milamDesignPatterns,
  title={Design patterns to guide player movement in 3D games},
  author={Milam, David and El Nasr, Magy Seif},
  booktitle={Proceedings of the 5th ACM SIGGRAPH Symposium on Video Games},
  pages={37--42},
  year={2010},
  organization={ACM}
}

@article{picbreeder,
  title={Picbreeder: A case study in collaborative evolutionary exploration of design space},
  author={Secretan, Jimmy and Beato, Nicholas and D'Ambrosio, David B and Rodriguez, Adelein and Campbell, Adam and Folsom-Kovarik, Jeremiah T and Stanley, Kenneth O},
  journal={Evolutionary Computation},
  volume={19},
  number={3},
  pages={373--403},
  year={2011},
  publisher={MIT Press}
}

@article{dryad,
  title={Exploratory modeling with collaborative design spaces},
  author={Talton, Jerry O and Gibson, Daniel and Yang, Lingfeng and Hanrahan, Pat and Koltun, Vladlen},
  journal={ACM Transactions on Graphics-TOG},
  volume={28},
  number={5},
  pages={167},
  year={2009}
}

@inproceedings{malone1982heuristics,
  title={Heuristics for designing enjoyable user interfaces: Lessons from computer games},
  author={Malone, Thomas W},
  booktitle={Proceedings of the 1982 conference on Human factors in computing systems},
  pages={63--68},
  year={1982},
  organization={ACM}
}


@article{talton2011metropolis,
  title={Metropolis procedural modeling},
  author={Talton, Jerry O and Lou, Yu and Lesser, Steve and Duke, Jared and Měch, Radomír and Koltun, Vladlen},
  journal={ACM Transactions on Graphics (TOG)},
  volume={30},
  number={2},
  pages={11},
  year={2011},
  publisher={ACM}
}
@inproceedings{hornby2000evolving,
  title={Evolving robust gaits with AIBO},
  author={Hornby, Gregory S and Takamura, Seiichi and Yokono, Jun and Hanagata, Osamu and Yamamoto, Takashi and Fujita, Masahiro},
  booktitle={Robotics and Automation, 2000. Proceedings. ICRA'00. IEEE International Conference on},
  volume={3},
  pages={3040--3045},
  year={2000},
  organization={IEEE}
}

@inproceedings{hornby2001evolution,
  title={Evolution of generative design systems for modular physical robots},
  author={Hornby, Gregory S and Lipson, Hod and Pollack, Jordan B},
  booktitle={Robotics and Automation, 2001. Proceedings 2001 ICRA. IEEE International Conference on},
  volume={4},
  pages={4146--4151},
  year={2001},
  organization={IEEE}
}


@incollection{lohn2005evolved,
  title={An evolved antenna for deployment on nasa’s space technology 5 mission},
  author={Lohn, Jason D and Hornby, Gregory S and Linden, Derek S},
  booktitle={Genetic Programming Theory and Practice II},
  pages={301--315},
  year={2005},
  publisher={Springer}
}

@article{elverdam2007game,
  title={Game Classification and Game Design Construction Through Critical Analysis},
  author={Elverdam, Christian and Aarseth, Espen},
  journal={Games and Culture},
  volume={2},
  number={1},
  pages={3--22},
  year={2007},
  publisher={SAGE publications}
}

@article{lindley2003game,
  title={Game taxonomies: A high level framework for game analysis and design},
  author={Lindley, Craig A},
  journal={Gamasutra. URL: www. gamasutra. com/features/20031003/lindley\_01. shtml},
  year={2003}
}

@article{davidsson2004game,
  title={Game design patterns for mobile games},
  author={Davidsson, Ola and Peitz, Johan and Bj{\"o}rk, Staffan},
  journal={Project report to Nokia Research Center, Finland},
  year={2004}
}
@article{bjork2005games,
  title={Games and design patterns},
  author={Bjork, Staffan and Holopainen, Jussi},
  journal={The Game Design Reader},
  pages={410--437},
  year={2005}
}

@book{alexander1979timeless,
  title={The timeless way of building},
  author={Alexander, Christopher},
  volume={1},
  year={1979},
  publisher={Oxford University Press}
}

@article{nielsen2005ten,
  title={Ten usability heuristics},
  author={Nielsen, Jakob}
}
@article{borchers2001pattern,
  title={A pattern approach to interaction design},
  author={Borchers, Jan O},
  journal={AI & SOCIETY},
  volume={15},
  number={4},
  pages={359--376},
  year={2001},
  publisher={Springer}
}

@article{zagal2013dark,
  title={Dark Patterns in the design of games},
  author={Zagal, Jos{\'e} P and Bj{\"o}rk, Staffan and Lewis, Chris},
  year={2013}
}

@inproceedings{lewis2012motivational,
  title={Motivational game design patterns of'ville games},
  author={Lewis, Chris and Wardrip-Fruin, Noah and Whitehead, Jim},
  booktitle={Proceedings of the International Conference on the Foundations of Digital Games},
  pages={172--179},
  year={2012},
  organization={ACM}
}


@misc{tidwell1999common,
  title={Common ground: A pattern language for human-computer interface design},
  author={Tidwell, Jenifer},
  url={http://www.mit.edu/~jtidwell/interaction_patterns.html}
  year={1999}
}

@book{gamma1994design,
  title={Design patterns: elements of reusable object-oriented software},
  author={Gamma, Erich and Helm, Richard and Johnson, Ralph and Vlissides, John},
  year={1994},
  publisher={Pearson Education}
}

@article{akers2012backtracking,
  title={Backtracking events as indicators of usability problems in creation-oriented applications},
  author={Akers, David and Jeffries, Robin and Simpson, Matthew and Winograd, Terry},
  journal={ACM Transactions on Computer-Human Interaction (TOCHI)},
  volume={19},
  number={2},
  pages={16},
  year={2012},
  publisher={ACM}
}
@inproceedings{tuite2012emergent,
  title={Emergent remix culture in an anonymous collaborative art system},
  author={Tuite, Kathleen and Smith, Adam M and Studio, Expressive Intelligence},
  booktitle={Proceedings of eighth artificial intelligence and interactive digital entertainment conference, Palo Alto},
  year={2012}
}

@article{bowman1975whatever,
  title={Whatever Happened to Droodles? Whatever Happened to Roger Price?},
  author={Bowman, David},
  journal={The Journal of Popular Culture},
  volume={9},
  number={1},
  pages={20--25},
  year={1975},
  publisher={Wiley Online Library}
}

@misc{kreimeier2002case,
  title={The case for game design patterns},
  author={Kreimeier, Bernd},
  url={http://www.gamasutra.com/view/feature/132649/the_case_for_game_design_patterns.php}
  year={2002}
}


@inproceedings{liapis2013sentient,
  title={Sentient Sketchbook: Computer-aided game level authoring.},
  author={Liapis, Antonios and Yannakakis, Georgios N and Togelius, Julian},
  booktitle={FDG},
  pages={213--220},
  year={2013}
}

@book{churchill,
  title={Painting as a Pastime},
  author={Churchill, Winston S},
  year={2014},
  publisher={RosettaBooks}
}

@Misc{rctexcitement,
author =   {Rollercoaster Tycoon Wiki},
title =    {Excitement},
howpublished = {web},
url = {http://rct.wikia.com/wiki/Excitement},
year = {2012}
}


@Misc{cellcycle,
author =   {Nervous System},
title =    {CellCycle},
howpublished = {web},
url = {https://n-e-r-v-o-u-s.com/cellCycle/},
year = {2012}
}
@article{winn2008design,
  title={The design, play, and experience framework},
  author={Winn, Brian},
  journal={Handbook of research on effective electronic gaming in education},
  volume={3},
  pages={1010--1024},
  year={2008},
  publisher={IGI Global Hershey, PA}
}

@Misc{boxmaker,
author =   {Rahulbotics},
title =    {BoxMaker},
howpublished = {web},
url = {http://boxmaker.rahulbotics.com/},
}

@Misc{christhesis,
           title = {Motivational Design Patterns},
          author = {Chris Lewis},
          school = {University of California, Santa Cruz},
            year = {2013}
}



@Misc{brainstormer,
author =   {Tapnik},
title =    {The Brainstormer},
howpublished = {web and iOS},
url = {http://andrewbosley.weebly.com/the-brainstormer.html},
year = {2013}
}




@Misc{kidpix,
author =   {Broderbund Software},
title =    {Kid Pix},
howpublished = {PC},
year = {1992}
}


@Misc{minecraft,
author =   {Mojang},
title =    {Minecraft},
howpublished = {PC},
year = {2009}
}
@Misc{spore,
author =   {Maxis},
title =    {Spore},
howpublished = {PC},
year = {2008}
}

@Misc{drawsomething,
author =   {OMGPop},
title =    {Draw Something},
howpublished = {iOS},
year = {2012}
}

@Misc{sporeGA,
author =   {Maxis},
title =    {Spore Galactic Adventures},
howpublished = {PC},
year = {2009}
}

@inproceedings{hastings2009evolving,
  title={Evolving content in the galactic arms race video game},
  author={Hastings, Erin J and Guha, Ratan K and Stanley, Kenneth O},
  booktitle={Computational Intelligence and Games, 2009. CIG 2009. IEEE Symposium on},
  pages={241--248},
  year={2009},
  organization={IEEE}
}

@Misc{applestoapples,
author =   {Out of the Box Publishing},
title =    {Apples to Apples},
howpublished = {Card game},
year = {1999}
}


@Misc{cardsagainsthumanity,
author =   {Cards Against Humanity, LLC},
title =    {Cards Against Humanity,
howpublished = {Card game},
year = {2010}
}


@Misc{spirograph,
author =   {Out of the Box Publishing},
title =    {Spirograph},
howpublished = {Toy},
year = {1999}
}



@Misc{twine,
author =   {Chris Klimas},
title =    {Twine},
howpublished = {PC},
url = {http://twinery.org/}
year = {2008}
}

@Misc{lbp,
author =   {Media Molecule},
title =    {LittleBigPlanet},
howpublished = {PS3},
year = {2008}
}


@Misc{thesims,
author =   {Maxis},
title =    {The Sims},
howpublished = {PC},
year = {2000}
}


@Misc{rollercoastertycoon,
author =   {Chris Sawyer Productions},
title =    {RollerCoaster Tycoon},
howpublished = {PC},
year = {1999}
}

@Misc{palettebuilder,
author =   {Playcrafts},
title =    {PaletteBuilder},
howpublished = {web},
url={http://www.play-crafts.com/blog/palettebuilder2/}
year = {2013}
}
@Misc{instagram,
author =   {Instagram},
title =    {Instagram},
howpublished = {iOS, Android, Windows Phone},
url ={http://instagram.com/}
year = {2010}
}



@Misc{thesims,
author =   {Maxis},
title =    {The Sims},
howpublished = {PC},
year = {2000}
}

@Misc{sims4,
author =   {Electronic Arts},
title =    {The Sims 4},
howpublished = {PC},
url ={http://www.thesims.com/the-sims-4},
year = {2014}
}



@Misc{rpgmaker,
author =   {ASCII / Enterbrain / Agetec / Degica Co., Ltd.},
title =    {RPGMaker},
howpublished = {PC},
url ={http://www.rpgmakerweb.com/company/},
year = {2007}
}

@Misc{picbreeder,
author =   {University of Florida, Jimmy Secretan},
title =    {PicBreeder},
howpublished = {web},
url ={http://picbreeder.org/},
year = {2007}
}

@inproceedings{secretan2008picbreeder,
  title={Picbreeder: evolving pictures collaboratively online},
  author={Secretan, Jimmy and Beato, Nicholas and D Ambrosio, David B and Rodriguez, Adelein and Campbell, Adam and Stanley, Kenneth O},
  booktitle={Proceedings of the SIGCHI Conference on Human Factors in Computing Systems},
  pages={1759--1768},
  year={2008},
  organization={ACM}
}


@Misc{silk,
author =   {Yuri Vishnevsky},
title =    {Silk – Interactive Generative Art},
howpublished = {Web and iOS},
url ={http://weavesilk.com/},
year = {2013}
}

@Misc{sketchabit,
author =   {Kathleen Tuite},
title =    {Sketch-a-bit },
howpublished = {Android},
url ={https://play.google.com/store/apps/details?id=com.superfiretruck.sketchabit&hl=en},
year = {2012}
}

@Misc{fingerpaint,
author =   {Kathleen Tuite and Adam Smith},
title =    {Impressionist Fingerpaint},
howpublished = {Android},
url ={https://play.google.com/store/apps/details?id=com.superfiretruck.impressionistfingerpaint},
year = {2012}
}

@Misc{electroplankton,
author =   {Toshio Iwai},
title =    {Electroplankton},
howpublished = {Nintendo DS},
url ={http://en.wikipedia.org/wiki/Electroplankton},
year = {2005}
}

@Misc{bubbleharp,
author =   {Snibbe Studio},
title =    {Bubble Harp},
howpublished = {iOS},
url ={http://www.snibbestudio.com/bubbleharp/},
year = {1997}
}

@Misc{tocasalon,
author =   {Toca Boca},
title =    {Toca Hair Salon 2},
howpublished = {Android, iOS},
url ={http://tocaboca.com/game/toca-hair-salon-2/},
year = {2013}
}

@Misc{wolframtones,
author =   {Wolfram Research},
title =    {Wolfram Tones},
howpublished = {web},
url ={http://tones.wolfram.com/},
year = {}
}



@Misc{cakepop,
author =   {Bake More Cake Maker Inc},
title =    {Cake Pop Maker },
howpublished = {iOS},
url ={https://itunes.apple.com/us/app/cake-pop-maker/id500941697?mt=8},
year = {2012}
}


@Misc{letscreatepottery,
author =   {Infinite Dreams Inc.},
title =    {Let's Create! Pottery},
howpublished = {2011},
url ={http://potterygame.com/},
year = {iOS}
}


@article{dietrich2010review,
  title={A review of EEG, ERP, and neuroimaging studies of creativity and insight.},
  author={Dietrich, Arne and Kanso, Riam},
  journal={Psychological bulletin},
  volume={136},
  number={5},
  pages={822},
  year={2010},
  publisher={American Psychological Association}
}

@article{stanley2005real,
  title={Real-time neuroevolution in the NERO video game},
  author={Stanley, Kenneth O and Bryant, Bobby D and Miikkulainen, Risto},
  journal={Evolutionary Computation, IEEE Transactions on},
  volume={9},
  number={6},
  pages={653--668},
  year={2005},
  publisher={IEEE}
}

@Misc{contextfreeart,
author =   {Chris Coyne},
title =    {Context Free Art},
howpublished = {online},
url = {http://www.contextfreeart.org/}
year = {2006}
}

@inproceedings{treanor2012micro,
  title={The micro-rhetorics of Game-o-Matic},
  author={Treanor, Mike and Schweizer, Bobby and Bogost, Ian and Mateas, Michael},
  booktitle={Proceedings of the International Conference on the Foundations of Digital Games},
  pages={18--25},
  year={2012},
  organization={ACM}
}
@book{rogers1985procedural,
  title={Procedural elements for computer graphics},
  author={Rogers, David F and others},
  volume={103},
  year={1985},
  publisher={McGraw-Hill New York}
}
@book{nierhaus2009algorithmic,
  title={Algorithmic composition: paradigms of automated music generation},
  author={Nierhaus, Gerhard},
  year={2009},
  publisher={Springer Verlag Wien}
}
@book{cross1977automated,
  title={The automated architect},
  author={Cross, Nigel},
  year={1977},
  publisher={Viking Penguin}
}
@book{simon1969sciences,
  title={The sciences of the artificial},
  author={Simon, Herbert A},
  year={1969},
  publisher={MIT press}
}
@unpublished{diefenbach2013moonlighters,
  Author = {Diefenbach, Edward and Sennott, Michael},
  Date-Added = {2013-03-02 00:46:32 +0000},
  Date-Modified = {2013-03-02 00:50:00 +0000},
  Note = {Personal correspondence},
  Title = {The Moonlighters},
  Year = {2013}}

@article{graetz1981origin,
  Author = {Graetz, J Martin},
  Journal = {Creative Computing},
  Number = {8},
  Pages = {56--67},
  Title = {The origin of Spacewar},
  Volume = {7},
  Year = {1981}}

@article{togelius2010search,
  Author = {Togelius, Julian and Yannakakis, Georgios and Stanley, Kenneth and Browne, Cameron},
  Journal = {Applications of Evolutionary Computation},
  Pages = {141--150},
  Publisher = {Springer},
  Title = {Search-based procedural content generation},
  Year = {2010}}

@article{sundberg1976generative,
  Author = {Sundberg, Johan and Lindblom, Bj{\"o}rn},
  Journal = {Cognition},
  Number = {1},
  Pages = {99--122},
  Publisher = {Elsevier},
  Title = {Generative theories in language and music descriptions},
  Volume = {4},
  Year = {1976}}

@article{stiny1972shape,
  Author = {Stiny, George and Gips, James},
  Journal = {Information processing},
  Number = {1460-1465},
  Publisher = {Amsterdam: North Holland},
  Title = {Shape grammars and the generative specification of painting and sculpture},
  Volume = {71},
  Year = {1972}}

@article{laske1973search,
  Author = {Laske, Otto E},
  Journal = {Perspectives of New Music},
  Number = {1/2},
  Pages = {351--378},
  Publisher = {JSTOR},
  Title = {In search of a Generative Grammar for Music},
  Volume = {12},
  Year = {1973}}
  
@inproceedings{tutenel2009rule,
  title={Rule-based layout solving and its application to procedural interior generation},
  author={Tutenel, Tim and Bidarra, Rafael and Smelik, Ruben M and de Kraker, Klaas Jan},
  booktitle={CASA Workshop on 3D Advanced Media In Gaming And Simulation},
  year={2009}
}


@conference{wright2005procedural,
  Author = {Wright, Will},
  Booktitle = {Game Developers Conference},
  Date-Added = {2013-03-01 23:39:01 +0000},
  Date-Modified = {2013-03-01 23:39:46 +0000},
  Title = {The Future of Content},
  Year = {2005}}

@article{wexler1970teaching,
  Author = {Wexler, JD},
  Journal = {International Journal of Man-Machine Studies},
  Number = {1},
  Pages = {1--27},
  Publisher = {Elsevier},
  Title = {A teaching program that generates simple arithmetic problems},
  Volume = {2},
  Year = {1970}}

@inproceedings{verma2010architectural,
  Author = {Verma, Manisha and Thakur, Manish K},
  Booktitle = {The 2nd International Conference on Computer and Automation Engineering},
  Organization = {IEEE},
  Pages = {268--275},
  Title = {Architectural space planning using Genetic Algorithms},
  Volume = {2},
  Year = {2010}}

@inproceedings{czarnecki1997beyond,
  Author = {Czarnecki, Krzysztof and Eisenecker, Ulrich W and Steyaert, Patrick},
  Booktitle = {Proceeding of the Aspect-Oriented Programming Workshop at ECOOP},
  Organization = {Citeseer},
  Pages = {1--8},
  Title = {Beyond objects: Generative programming},
  Volume = {97},
  Year = {1997}}

@inproceedings{smith2010variations,
  title={Variations forever: Flexibly generating rulesets from a sculptable design space of mini-games},
  author={Smith, Adam M and Mateas, Michael},
  booktitle={Proceedings of the IEEE Conference on Computational Intelligence and Games (CIG)},
  year={2010}
}

@article{eastman1970representations,
  Author = {Eastman, Charles M},
  Journal = {Communications of the ACM},
  Number = {4},
  Pages = {242--250},
  Publisher = {ACM},
  Title = {Representations for space planning},
  Volume = {13},
  Year = {1970}}

@inproceedings{lamstein2004search,
  Author = {Lamstein, Ari and Mateas, Michael},
  Booktitle = {Proc. of the 2004 AAAI Workshop on Challenges in Game Artificial Intelligence},
  Title = {Search-based drama management},
  Year = {2004}}

@article{michielssen1993design,
  Author = {Michielssen, Eric and Sajer, J-M and Ranjithan, S and Mittra, Raj},
  Journal = {Microwave Theory and Techniques, IEEE Transactions on},
  Number = {6},
  Pages = {1024--1031},
  Publisher = {IEEE},
  Title = {Design of lightweight, broad-band microwave absorbers using genetic algorithms},
  Volume = {41},
  Year = {1993}}

@article{chomsky1956three,
  Author = {Chomsky, Noam},
  Journal = {Information Theory, IRE Transactions on},
  Number = {3},
  Pages = {113--124},
  Publisher = {IEEE},
  Title = {Three models for the description of language},
  Volume = {2},
  Year = {1956}}

@inproceedings{Greuter:2003:RPG:604471.604490,
  Acmid = {604490},
  Address = {New York, NY, USA},
  Author = {Greuter, Stefan and Parker, Jeremy and Stewart, Nigel and Leach, Geoff},
  Booktitle = {Proceedings of the 1st international conference on Computer graphics and interactive techniques in Australasia and South East Asia},
  Doi = {10.1145/604471.604490},
  Isbn = {1-58113-578-5},
  Keywords = {LRU caching, architecture, procedural generation, real-time, view frustum filling},
  Location = {Melbourne, Australia},
  Publisher = {ACM},
  Series = {GRAPHITE '03},
  Title = {Real-time procedural generation of \`pseudo infinite' cities},
  Url = {http://doi.acm.org/10.1145/604471.604490},
  Year = {2003},
  Bdsk-Url-1 = {http://doi.acm.org/10.1145/604471.604490},
  Bdsk-Url-2 = {http://dx.doi.org/10.1145/604471.604490}}

@article{herskovits1973generation,
  Author = {Herskovits, Annette},
  Publisher = {Stanford University},
  Title = {The generation of French from a semantic representation.},
  Year = {1973}}

@book{ebert2002texturing,
  Author = {Ebert, David S and Musgrave, F Kenton and Peachey, Darwyn and Perlin, Ken and Worley, Steve},
  Publisher = {Morgan Kaufmann},
  Title = {Texturing and modeling: a procedural approach},
  Year = {2002}}

@techreport{macri2000procedural,
  Author = {Macri, D. and Pallister, K.},
  Date-Added = {2013-03-01 23:32:24 +0000},
  Date-Modified = {2013-03-02 16:37:27 +0000},
  Institution = {Intel Developer Service},
  Lastchecked = {March 1, 2013},
  Title = {Procedural 3D Content Generation},
  Url = {http://web.archive.org/web/20050105033528/http://www.intel.com/cd/ids/developer/asmo-na/eng/segments/games/resources/graphics/20247.htm?page=2},
  Year = {2000}}

@incollection{space-planning-new,
  Author = {Schneider, Sven and Fischer, Jan-Ruben and K{\"o}nig, Reinhard},
  Booktitle = {Design Computing and Cognition '10},
  Doi = {10.1007/978-94-007-0510-4_20},
  Editor = {Gero, JohnS.},
  Isbn = {978-94-007-0509-8},
  Pages = {367-386},
  Publisher = {Springer Netherlands},
  Title = {Rethinking Automated Layout Design: Developing a Creative Evolutionary Design Method for the Layout Problems in Architecture and Urban Design},
  Url = {http://dx.doi.org/10.1007/978-94-007-0510-4_20},
  Year = {2011},
  Bdsk-Url-1 = {http://dx.doi.org/10.1007/978-94-007-0510-4_20}}

@inproceedings{smith2010tanagra,
  Author = {Smith, Gillian and Whitehead, Jim and Mateas, Michael},
  Booktitle = {Proceedings of the Fifth International Conference on the Foundations of Digital Games},
  Organization = {ACM},
  Pages = {209--216},
  Title = {Tanagra: A mixed-initiative level design tool},
  Year = {2010}}

@article{smith2011launchpad,
  Author = {Smith, Gillian and Whitehead, Jim and Mateas, Michael and Treanor, Mike and March, Jameka and Cha, Mee},
  Journal = {IEEE Transactions on Computational Intelligence and AI in Games},
  Number = {1},
  Pages = {1--16},
  Publisher = {IEEE},
  Title = {Launchpad: A Rhythm-Based Level Generator for 2-D Platformers},
  Volume = {3},
  Year = {2011}}

@inproceedings{smith2010analyzing,
  Author = {Smith, Gillian and Whitehead, Jim},
  Booktitle = {Proceedings of the 2010 Workshop on Procedural Content Generation in Games},
  Organization = {ACM},
  Pages = {4},
  Title = {Analyzing the expressive range of a level generator},
  Year = {2010}}


@book{turner1994creative,
  title={The creative process: A computer model of storytelling and creativity},
  author={Turner, Scott R},
  year={1994},
  publisher={Psychology Press}
}





@ONLINE{twine,
author = {Klimas, Chris},
title = {Twine},
year = {2009},
url = {http://twinery.org/}
}

@misc{emshort,
author = {Short, Emily},
title = {Choice-based Narrative Tools: Twine â€¦ is ePub},
journal = {Emily Short's Interactive Storytelling},
type = {Blog},
number = {November 10},
year = {2012},
howpublished = {\\url{http://emshort.wordpress.com/2012/11/10/choice-based-narrative-tools-twine/}}

@article{friedhoff2013untangling,
title={Untangling Twine: A Platform Study},
journal={Proceedings of DiGRA 2013: DeFragging Game Studies},
author={Friedhoff, Jane},
year={2013}
}


@article{nasta1984thief,
  title={Book Review: Thief of Arts},
  journal={PC News},
  author={Nasta, Terry},
  year={1984}
}

@article {shneiderman1983direct,
author={Shneiderman, Ben},
title ={Direct Manipulation: A Step Beyond Programming  Languages},
 journal={IEEE Computer},
 
volume={16},
number={8},
pages={57-69},
year={1983},
}


@inproceedings{dormans2011level,
  title={Level design as model transformation: a strategy for automated content generation},
  author={Dormans, Joris},
  booktitle={Proceedings of the 2nd International Workshop on Procedural Content Generation in Games},
  pages={2},
  year={2011},
  organization={ACM}
}

@article{fairclough2004ai,
  title={AI structuralist storytelling in computer games},
  author={Fairclough, Chris and Cunningham, P{\\'a}draig},
  year={2004},
  publisher={Trinity College Dublin, Department of Computer Science}
}

@article{riedl2010narrative,
  title={Narrative planning: balancing plot and character},
  author={Riedl, Mark O and Young, R Michael},
  journal={Journal of Artificial Intelligence Research},
  volume={39},
  number={1},
  pages={217--268},
  year={2010}
}
@article{bowman,
  title={Whatever Happened to Droodles? Whatever Happened to Roger Price?},
  author={Bowman, David},
  journal={The Journal of Popular Culture},
  volume={9},
  number={1},
  pages={20--25},
  year={1975},
  publisher={Wiley Online Library}
}

@book{propp,
  title={Morphology of the Folktale: Revised and Edited with Preface by Louis A. Wagner, Introduction by Alan Dundes},
  author={Propp, Vladimir},
  volume={9},
  year={2010},
  publisher={University of Texas Press}
}

@article{icebound,
  title={Author Assistance Visualizations for Ice-Bound, A Combinatorial Narrative},
  journal={Foundations of Digital Games},
  author={Garbe, Jacob and Reed, Aaron and Dickinson, Melanie and Mateas, Michael and Wardrip-Fruin, Noah},
  year={2014}
}

@article{skorupski2009interactive,
  title={Interactive story generation for writers: Lessons learned from the Wide Ruled authoring tool},
  author={Skorupski, James and Mateas, Michael},
  journal={In Proceedings of DAC ‘09},
  city={Irvine, CA},
  year={2009}
}

@book{flow,
  title={Flow and the Psychology of Discovery and Invention},
  author={Csikszentmihalyi, Mihaly},
  publisher={HarperPerennial, New York},
  year={1997}
}


@article{black1979evaluation,
  title={An Evaluation of Story Grammars*},
  author={Black, John B and Wilensky, Robert},
  journal={Cognitive Science},
  volume={3},
  number={3},
  pages={213--229},
  year={1979},
  publisher={Wiley Online Library}
}

@article{rumelhart1975notes,
  title={Notes on a schema for stories},
  journal={Representation and understanding: Studies in cognitive science},
  author={Rumelhart, David E},
  year={1975},
  publisher={ Academic Press},
  city={New York}
}

@article{rumelhart1980evaluating,
  title={On evaluating story grammars},
  author={Rumelhart, David E},
  journal={Cognitive Science},
  volume={4},
  number={3},
  pages={313--316},
  year={1980},
  publisher={Elsevier}
}
@book{siratori2002blood,
  title={Blood Electric},
  author={Siratori, Kenji},
  year={2002},
  publisher={Creation Books}
}

@inproceedings{lang1999declarative,
  title={A declarative model for simple narratives},
  author={Lang, Raymond},
  booktitle={Proceedings of the AAAI fall symposium on narrative intelligence},
  pages={134--141},
  year={1999}
}


@misc{walkers,
  title = {Genetic Algorithm Walkers},
  howpublished = {\\url{http://rednuht.org/genetic_walkers/}},
  note = {Accessed: 2015-05-04}
}

@article{dryad,
  title={Exploratory modeling with collaborative design spaces},
  author={Talton, Jerry O and Gibson, Daniel and Yang, Lingfeng and Hanrahan, Pat and Koltun, Vladlen},
  journal={ACM Transactions on Graphics-TOG},
  volume={28},
  number={5},
  pages={167},
  year={2009}
}

@misc{boxcar2d,
  title = {BoxCar 2D: Computation Intelligence Car Evolution Using Box2D Physics (v3.2)},
  howpublished = {\\url{http://boxcar2d.com/}},
  note = {Accessed: 2015-05-04}
  }

@article{glimberg2007comparison,
  title={Comparison of ragdoll methods},
  author={Glimberg, Stefan and Engel, Morten},
  year={2007}
}

@inproceedings{mccoy2011prom,
  title={Prom Week: social physics as gameplay},
  author={McCoy, Josh and Treanor, Mike and Samuel, Ben and Mateas, Michael and Wardrip-Fruin, Noah},
  booktitle={Proceedings of the 6th International Conference on Foundations of Digital Games},
  pages={319--321},
  year={2011},
  organization={ACM}
}

@book{pugh1976introduction,
  title={An introduction to tensegrity},
  author={Pugh, Anthony},
  year={1976},
  publisher={Univ of California Press}
}

@inproceedings{jakobsen2001advanced,
  title={Advanced character physics},
  author={Jakobsen, Thomas},
  booktitle={Game Developers Conference},
  pages={383--401},
  year={2001}
}

@article{arts2000sims,
  title={The Sims},
  author={Maxis},
  journal={Electronic Arts},
  year={2000}
}

@book{guest1998choreo,
  title={Choreo-graphics: a comparison of dance notation systems from the fifteenth century to the present},
  author={Guest, Ann Hutchinson},
  year={1998},
  publisher={Psychology Press}
}
@book{thomas1995illusion,
  title={The illusion of life: Disney animation},
  author={Thomas, Frank and Johnston, Ollie and Frank. Thomas},
  year={1995},
  publisher={Hyperion New York}
}

@inproceedings{hecker2008real,
  title={Real-time motion retargeting to highly varied user-created morphologies},
  author={Hecker, Chris and Raabe, Bernd and Enslow, Ryan W and DeWeese, John and Maynard, Jordan and van Prooijen, Kees},
  booktitle={ACM Transactions on Graphics (TOG)},
  volume={27},
  number={3},
  pages={27},
  year={2008},
  organization={ACM}
}

@article{heider1944experimental,
  title={An experimental study of apparent behavior},
  author={Heider, Fritz and Simmel, Marianne},
  journal={The American Journal of Psychology},
  pages={243--259},
  year={1944},
  publisher={JSTOR}
}

@article{ada2003expression,
  title={Expression of emotions in dance: Relation between arm movement characteristics and emotion},
  author={Sawada, Misako and Suda, Kazuhiro and Ishii, Motonobu},
  journal={Perceptual and motor skills},
  volume={97},
  number={3},
  pages={697--708},
  year={2003},
  publisher={Ammons Scientific}
}

@article{perlin1995real,
  title={Real time responsive animation with personality},
  author={Perlin, Ken},
  journal={Visualization and Computer Graphics, IEEE Transactions on},
  volume={1},
  number={1},
  pages={5--15},
  year={1995},
  publisher={IEEE}
}

@incollection{dubbin2010learning,
  title={Learning to dance through interactive evolution},
  author={Dubbin, Greg A and Stanley, Kenneth O},
  booktitle={Applications of Evolutionary Computation},
  pages={331--340},
  year={2010},
  publisher={Springer}
}


@inproceedings{jadhav2012art,
  title={Art to SMart: an evolutionary computational model for BharataNatyam choreography},
  author={Jadhav, Swati and Joshi, Madhura and Pawar, Jyoti},
  booktitle={Hybrid Intelligent Systems (HIS), 2012 12th International Conference on},
  pages={384--389},
  year={2012},
  organization={IEEE}
}

@incollection{eisenmann2011creating,
  title={Creating choreography with interactive evolutionary algorithms},
  author={Eisenmann, Jonathan and Schroeder, Benjamin and Lewis, Matthew and Parent, Rick},
  booktitle={Applications of Evolutionary Computation},
  pages={293--302},
  year={2011},
  publisher={Springer}
}


@inproceedings{carlson2011scuddle,
  title={Scuddle: Generating movement catalysts for computer-aided choreography},
  author={Carlson, Kristin and Schiphorst, Thecla and Pasquier, Philippe},
  booktitle={Proceedings of the Second International Conference on Computational Creativity},
  pages={123--128},
  year={2011}
}


@article{humanGuided,
  title={Human-guided search},
  author={Klau, Gunnar W and Lesh, Neal and Marks, Joe and Mitzenmacher, Michael},
  journal={Journal of Heuristics},
  volume={16},
  number={3},
  pages={289--310},
  year={2010},
  publisher={Springer}
}

@article{reynolds1987flocks,
  title={Flocks, herds and schools: A distributed behavioral model},
  author={Reynolds, Craig W},
  journal={ACM Siggraph Computer Graphics},
  volume={21},
  number={4},
  pages={25--34},
  year={1987},
  publisher={ACM}
}

@book{braitenberg1986vehicles,
  title={Vehicles: Experiments in synthetic psychology},
  author={Braitenberg, Valentino},
  year={1986},
  publisher={MIT press}
}

@article{directManipulation,
  title={Direct Manipulation: a step beyond programming languages},
  author={Shneiderman, Ben},
  journal={Sparks of innovation in human-computer interaction},
  volume={17},
  pages={1993},
  year={1993}
}

@book{artAndFear,
  title={Art \\& fear},
  author={Bayles, David and Orland, Ted and Morey, Arthur},
  year={2012},
  publisher={Tantor Media, Incorporated}
}

@incollection{colton2012painting,
  title={The painting fool: Stories from building an automated painter},
  author={Colton, Simon},
  booktitle={Computers and creativity},
  pages={3--38},
  year={2012},
  publisher={Springer}
}
@inproceedings{geroExploration,
  title={Towards a model of exploration in computer-aided design.},
  author={Gero, John S},
  booktitle={Formal design methods for CAD},
  pages={315--336},
  year={1994}
}

@inproceedings{jokes,
  title={Unsupervised joke generation from big data.},
  author={Petrovic, Sasa and Matthews, David},
  booktitle={ACL (2)},
  pages={228--232},
  year={2013}
}

@article{shneiderman2007creativity,
  title={Creativity support tools: Accelerating discovery and innovation},
  author={Shneiderman, Ben},
  journal={Communications of the ACM},
  volume={50},
  number={12},
  pages={20--32},
  year={2007},
  publisher={ACM}
}


@article{scratch,
  title={Scratch: programming for all},
  author={Resnick, Mitchel and Maloney, John and Monroy-Hern{\\'a}ndez, Andr{\\'e}s and Rusk, Natalie and Eastmond, Evelyn and Brennan, Karen and Millner, Amon and Rosenbaum, Eric and Silver, Jay and Silverman, Brian and others},
  journal={Communications of the ACM},
  volume={52},
  number={11},
  pages={60--67},
  year={2009},
  publisher={ACM}
}

@techreport{taltonTrees,
  title={Collaborative Mapping of a Parametric Design Space},
  author={Talton, Jerry and Gibson, Daniel and Hanrahan, Pat and Koltun, Vladlen},
  year={2008},
   institution={Citeseer}
}

@article{computationalCreativity,
  title={Computational creativity: Coming of age},
  author={Colton, Simon and L{\\'o}pez de Mantaras, Ram{\\'o}n and Stock, Oliviero and others},
  journal={AI Magazine},
  volume={30},
  number={3},
  pages={11--14},
  year={2009}
}


@article{partners,
  title={How can computers be partners in the creative process: classification and commentary on the special issue},
  author={Lubart, Todd},
  journal={International Journal of Human-Computer Studies},
  volume={63},
  number={4},
  pages={365--369},
  year={2005},
  publisher={Elsevier}
}

@article{iCanMakeAnother,
  title={\`I can always make another one!'--Young musicians creating music with digital tools},
  author={Nilsson, Bo},
  journal={Musicianship in the 21st century: issues, trends and possibilities (Sydney, Australian Music Centre)},
  year={2003}
}
@inproceedings{tracery,
  title={Tracery: Approachable Story Grammar Authoring for Casual Users},
  author={Compton, Kate and Filstrup, Benjamin and Mateas, Michae and others},
  booktitle={Seventh Intelligent Narrative Technologies Workshop},
  year={2014}
}


@inproceedings{checker,
  title={Real-time motion retargeting to highly varied user-created morphologies},
  author={Hecker, Chris and Raabe, Bernd and Enslow, Ryan W and DeWeese, John and Maynard, Jordan and van Prooijen, Kees},
  booktitle={ACM Transactions on Graphics (TOG)},
  volume={27},
  pages={27},
  year={2008},
  organization={ACM}
}

@misc{nervousSystem,
title={Nervous System},
  author = {Nervous System},
year = {2015},
}

@misc{Twine,
  title={Twine},
  author={Klimas, Chris},
  note = {Accessed: 2015-02-24},
   year={2012}
}




@article{shneiderman2006creativity,
  title={Creativity support tools: Report from a US National Science Foundation sponsored workshop},
  author={Shneiderman, Ben and Fischer, Gerhard and Czerwinski, Mary and Resnick, Mitch and Myers, Brad and Candy, Linda and Edmonds, Ernest and Eisenberg, Mike and Giaccardi, Elisa and Hewett, Tom and others},
  journal={International Journal of Human-Computer Interaction},
  volume={20},
  number={2},
  pages={61--77},
  year={2006},
  publisher={Taylor \\& Francis}
}


@article{designPrinciples,
  title={Design principles for tools to support creative thinking},
  author={Resnick, Mitchel and Myers, Brad and Nakakoji, Kumiyo and Shneiderman, Ben and Pausch, Randy and Selker, Ted and Eisenberg, Mike},
  year={2005}
}

@book{flow,
  title={Flow},
  author={Csikszentmihalyi, Mihaly},
  year={2014},
  publisher={Springer}
}

@inproceedings{sentientSketchbook,
  title={Mixed-initiative Cocreativity},
  booktitle={Proceedings of the 9th Conference on the Foundations of Digital Games},
  year={2014},
  author={Yannakakis, Georgios N and Liapis, Antonios and Alexopoulos, Constantine}
}

@article{picBreeder,
  title={Picbreeder: A case study in collaborative evolutionary exploration of design space},
  author={Secretan, Jimmy and Beato, Nicholas and D'Ambrosio, David B and Rodriguez, Adelein and Campbell, Adam and Folsom-Kovarik, Jeremiah T and Stanley, Kenneth O},
  journal={Evolutionary Computation},
  volume={19},
  number={3},
  pages={373--403},
  year={2011},
  publisher={MIT Press}
}

@article{amabileMotivation,
  title={Social influences on creativity: Evaluation, coaction, and surveillance},
  author={Amabile, Teresa M and Goldfarb, Phyllis and Brackfleld, Shereen C},
  journal={Creativity research journal},
  volume={3},
  number={1},
  pages={6--21},
  year={1990},
  publisher={Taylor \\& Francis}
}

@book{leonardosLaptop,
  title={Leonardo's laptop: human needs and the new computing technologies},
  author={Shneiderman, Ben},
  year={2003},
  publisher={Mit Press}
}

@article{fourTypes,
  title={Beyond big and little: The four c model of creativity.},
  author={Kaufman, James C and Beghetto, Ronald A},
  journal={Review of general psychology},
  volume={13},
  number={1},
  pages={1},
  year={2009},
  publisher={Educational Publishing Foundation}
}

@article{boden2009computerModels,
  title={Computer models of creativity},
  author={Boden, Margaret A},
  journal={AI Magazine},
  volume={30},
  number={3},
  pages={23},
  year={2009}
}

@book{beyondBoredom,
  title={Beyond boredom and anxiety.},
  author={Csikszentmihalyi, Mihaly},
  year={2000},
  publisher={Jossey-Bass}
}

@inproceedings{kuznetsov2010rise,
  title={Rise of the expert amateur: DIY projects, communities, and cultures},
  author={Kuznetsov, Stacey and Paulos, Eric},
  booktitle={Proceedings of the 6th Nordic Conference on Human-Computer Interaction: Extending Boundaries},
  pages={295--304},
  year={2010},
  organization={ACM}
}

@article{schonMaterials,
  title={Designing as reflective conversation with the materials of a design situation},
  author={Schon, Donald A},
  journal={Research in Engineering Design},
  volume={3},
  number={3},
  pages={131--147},
  year={1992},
  publisher={Springer}
}

@inproceedings{candy2002modeling,
  title={Modeling co-creativity in art and technology},
  author={Candy, Linda and Edmonds, Ernest},
  booktitle={Proceedings of the 4th conference on Creativity \\& cognition},
  pages={134--141},
  year={2002},
  organization={ACM}
}

@inproceedings{warr2005understanding,
  title={Understanding design as a social creative process},
  author={Warr, Andy and O'Neill, Eamonn},
  booktitle={Proceedings of the 5th conference on Creativity \& cognition},
  pages={118--127},
  year={2005},
  organization={ACM}
}

@inproceedings{collectiveCreativity,
  title={Computational and collective creativity: who's being creative?},
  author={Maher, Mary Lou},
  booktitle={Proceedings of the 3rd International Conference on Computational Creativity},
  pages={67--71},
  year={2012},
}

@inproceedings{colleagues,
  title={Building Artistic Computer Colleagues with an Enactive Model of Creativity},
  author={Davis, Nicholas and Popova, Yanna and Sysoev, Ivan and Hsiao, Chih-Pin and Zhang, Dingtian and Magerko, Brian},
   booktitle={Proceedings of the 5th International Conference on Computational Creativity},
      year={2014},
}

@inproceedings{fallman2003design,
  title={Design-oriented human-computer interaction},
  author={Fallman, Daniel},
  booktitle={Proceedings of the SIGCHI conference on Human factors in computing systems},
  pages={225--232},
  year={2003},
  organization={ACM}
}

@article{candy1997computers,
  title={Computers and creativity support: knowledge, visualisation and collaboration},
  author={Candy, Linda},
  journal={Knowledge-Based Systems},
  volume={10},
  number={1},
  pages={3--13},
  year={1997},
  publisher={Elsevier}
}


@phdthesis{magicCrayons,
  title={Miniature gardens \\& magic crayons: Games, spaces, \\& worlds},
  author={Gingold, Chaim},
  year={2003},
  school={Georgia Institute of Technology}
}

@inproceedings{generativeMethods,
  title={Generative methods},
  author={Compton, Kate and Osborn, Joseph C and Mateas, Michael},
  booktitle={The Fourth Procedural Content Generation in Games workshop, PCG},
  year={2013}
}

@article{wierenga1998dependent,
  title={The dependent variable in research into the effects of creativity support systems: quality and quantity of ideas},
  author={Wierenga, Berend and Van Bruggen, Gerrit H},
  journal={MIS quarterly},
  pages={81--87},
  year={1998},
  publisher={JSTOR}
}

@article{shneiderman2007creativity,
  title={Creativity support tools: Accelerating discovery and innovation},
  author={Shneiderman, Ben},
  journal={Communications of the ACM},
  volume={50},
  number={12},
  pages={20--32},
  year={2007},
  publisher={ACM}
}

@article {shneiderman1983direct,
author={Shneiderman, Ben},
title ={Direct Manipulation: A Step Beyond Programming  Languages},
 journal={IEEE Computer},
 
volume={16},
number={8},
pages={57-69},
year={1983},
}

@inproceedings{gold1998quad,
  title={The quad-arc data structure},
  author={Gold, CM},
  booktitle={Proceedings, 8th International Symposium on Spatial Data Handling},
  pages={713--724},
  year={1998}
}

@article{chew1989constrained,
  title={Constrained delaunay triangulations},
  author={Chew, L Paul},
  journal={Algorithmica},
  volume={4},
  number={1-4},
  pages={97--108},
  year={1989},
  publisher={Springer}
}

@article{cignoni1997computer,
  title={Computer-assisted generation of bas-and high-reliefs},
  author={Cignoni, Paolo and Montani, Claudio and Scopigno, Roberto},
  journal={Journal of graphics tools},
  volume={2},
  number={3},
  pages={15--28},
  year={1997},
  publisher={Taylor \\& Francis}
}

@inproceedings{kerber2009feature,
  title={Feature sensitive bas relief generation},
  author={Kerber, Jens and Tevs, Art and Belyaev, Alexander and Zayer, Rhaleb and Seidel, H-P},
  booktitle={Shape Modeling and Applications, 2009. SMI 2009. IEEE International Conference on},
  pages={148--154},
  year={2009},
  organization={IEEE}
}

@article{alexa2010reliefs,
  title={Reliefs as images},
  author={Alexa, Marc and Matusik, Wojciech},
  journal={ACM Transactions on Graphics},
  volume={29},
  number={4},
  pages={60},
  year={2010},
  publisher={Citeseer}
}

@article{barrios2006thinking,
  title={Thinking parametric design: introducing parametric Gaudi},
  author={Barrios Hernandez, Carlos Roberto},
  journal={Design Studies},
  volume={27},
  number={3},
  pages={309--324},
  year={2006},
  publisher={Elsevier}
}
@inproceedings{havemann2004generative,
  title={Generative parametric design of gothic window tracery},
  author={Havemann, Sven and Fellner, Dieter W},
  booktitle={Proceedings of the 5th International conference on Virtual Reality, Archaeology and Intelligent Cultural Heritage},
  pages={193--201},
  year={2004},
  organization={Eurographics Association}
}

@inproceedings{anderl1995parametric,
  title={Parametric design and its impact on solid modeling applications},
  author={Anderl, Reiner and Mendgen, Ralf},
  booktitle={Proceedings of the third ACM symposium on Solid modeling and applications},
  pages={1--12},
  year={1995},
  organization={ACM}
}
  @book{boden92,
author = {Margaret Boden},
title = {The Creative Mind},
publisher = {Abacus},
address = {London},
year = {1992},
}

@article{ritchie07,
 author  = {Graeme Ritchie},
 title = {Some Empirical Criteria for Attributing Creativity to a Computer Program},
 journal = {Minds and Machines},
 publisher = {Springer},
 year = {2007}, 
 pages = {76-99},
 volume = {17},
}


@misc{UCI,
 author = "A. Asuncion and D.J. Newman",
 title = "{UCI} Machine Learning Repository", 
 note = "http://www.ics.uci.edu/~mlearn/MLRepository.html",
 howpublished = "University of California, Irvine, School of Information and Computer Sciences"
}


@inproceedings{veale07,
 author = {Tony Veale and Yanfen Hao},
 title = {Comprehending and Generating Apt Metaphors: A Web-driven, Case-based Approach to Figurative Language},
 booktitle = {Proceedings of the Twenty-Second AAAI Conference on Artificial Intelligence (AAAI-07)},
 year = {2007},
 pages = {1471--1476},
 publisher = {AAAI Press},
 address = {Vancouver, British Columbia},
 }

@article{lyu04,
 author = {Siwei Lyu and Daniel Rockmore and Hany Farid},
 title = {A Digital Technique for Art Authentication},
 journal = {Proceedings of the National Academy of Sciences},
 volume = {101},
 number = {49},
 year = {2004},
 pages = {17006--17010},
 }


@Book{Ruch07,
 editor =      {Willibald Ruch},
 title =       {The Sense of Humor: Explorations of a Personality
Characteristic},
 publisher =   {Mouton de Gruyter},
 year =        2007,
 series =      {Mouton Select},
 address =     {Berlin}
}

@techreport{OZ,
 AUTHOR =      {Mark Kantrowitz},
 TITLE =       {Natural Language Text Generation in the {OZ}
                 Interactive Fiction Project},
 YEAR =        {1990},
 INSTITUTION =         {School of Computer Science, Carnegie Mellon
                 University},
 ADDRESS =     {Pittsburgh, PA},
 NUMBER =      {CMU-CS-90-158},
 TYPE =        {Technical Report}
}

@inproceedings{mccoy2011prom,
  title={Prom Week: social physics as gameplay},
  author={McCoy, Josh and Treanor, Mike and Samuel, Ben and Mateas, Michael and Wardrip-Fruin, Noah},
  booktitle={Proceedings of the 6th International Conference on Foundations of Digital Games},
  pages={319--321},
  year={2011},
  organization={ACM}
}
@inproceedings{hunicke2004mda,
  title={MDA: A formal approach to game design and game research},
  author={Hunicke, R. and LeBlanc, M. and Zubek, R.},
  booktitle={Proceedings of the AAAI Workshop on Challenges in Game AI},
  pages={04--04},
  year={2004}
}

@book{steinmeyer2005hiding,
  title={Hiding the elephant},
  author={Steinmeyer, J.},
  year={2005},
  publisher={Arrow}
}
@article{sharkey2006artificial,
  title={Artificial intelligence and natural magic},
  author={Sharkey, N. and Sharkey, A.},
  journal={Artificial Intelligence Review},
  volume={25},
  number={1},
  pages={9--19},
  year={2006},
  publisher={Springer}
}


@article{norman1983some,
  title={Some observations on mental models},
  author={Norman, D.},
  journal={Mental models},
  volume={7},
  year={1983}
}

@article{black1952identity,
  title={The identity of indiscernibles},
  author={Black, M.},
  journal={Mind},
  volume={61},
  number={242},
  pages={153--164},
  year={1952},
  publisher={JSTOR}
}

@inproceedings{tognazzini1993principles,
  title={Principles, techniques, and ethics of stage magic and their application to human interface design},
  author={Tognazzini, B.},
  booktitle={Proceedings of the INTERACT'93 and CHI'93 conference on Human factors in computing systems},
  pages={355--362},
  year={1993},
  organization={ACM}
}

@article{acrowdforms,
  title={Crowd Forms Against an Algorithm},
  author={Rich, Motoko},
  journal={New York Times},
month=apr,
date={18},
  year={2009}
}

@misc{siri,
author = {Apple Inc.  http://www.apple.com/iphone/features/siri.html},
title = {Siri: Your wish is its command},
month = jun,
year = {2012},
url = {}
}

@article{mcdermott1976artificial,
  title={Artificial intelligence meets natural stupidity},
  author={McDermott, D.},
  journal={ACM SIGART Bulletin},
  number={57},
  pages={4--9},
  year={1976},
  publisher={ACM}
}


@article{logas2011meta,
  title={Meta-Rules and Complicity in Brenda Brathwaite’s Train},
  author={Logas, H.L.},
  year={2011}
}


@inproceedings{mccoy2011prom,
  title={Prom Week: social physics as gameplay},
  author={McCoy, J. and Treanor, M. and Samuel, B. and Mateas, M. and Wardrip-Fruin, N.},
  booktitle={Proceedings of the 6th International Conference on Foundations of Digital Games},
  pages={319--321},
  year={2011},
  organization={ACM}
}

@book{wardrip2009expressive,
  title={Expressive Processing: Digital fictions, computer games, and software studies},
  author={Wardrip-Fruin, N.},
  year={2009},
  publisher={The MIT Press}
}



@book{agre,
  title={Computation and human experience},
  author={Agre, P.},
  year={1997},
  publisher={Cambridge Univ Pr}
}



@article{poe,
  title={Maelzel’s chess-player},
  author={Poe, E.A.},
  journal={Southern Literary Messenger},
  volume={2},
  number={5},
  pages={318--326},
  year={1836}
}
@MISC{promweek,
   author = "University of California at Santa Cruz",
   title = "Prom Week",
   howpublished = "http://promweek.soe.ucsc.edu/",
   year = 2012,
}
}
@MISC{photopia,
   author = {Cadre, Adam},
   title = "Photopia",
   year = 1998,
}


@MISC{sirifail,
author = {http://www.damnyousiri.org},
title = {Damn You, Siri},
month = jun,
year = {2012},
url = {}
}


@MISC{talkingtomachines,
author = "RadioLab",
title = "Talking to Machines",
howpublished = "http://www.radiolab.org/2011/may/31/",
year = 2011,
month = may,
day = 31
}



@book{thompson1989motif,
  title={Motif-index of folk-literature: a classification of narrative elements in folktales, ballads, myths, fables, mediaeval romances, exempla, fabliaux, jest-books and local legends},
  author={Thompson, Stith},
  volume={4},
  year={1989},
  publisher={Indiana University Press}
}

@book{craft2004masquerade,
  title={Masquerade \\& Gender},
  author={Craft-Fairchild, Catherine},
  year={2004},
  publisher={Pennsylvania State University Press}
}

@article{bradbrook1952shakespeare,
  title={Shakespeare and the Use of Disguise in Elizabethan Drama},
  author={Bradbrook, Muriel Clara},
  journal={Essays in Criticism},
  volume={2},
  number={2},
  pages={159--168},
  year={1952},
  publisher={Oxford Univ Press}
}

@article{jenkins2004game,
  title={Game design as narrative architecture},
  author={Jenkins, Henry},
  journal={Computer},
  volume={44},
  pages={s3},
  year={2004}
}

@article{muecke1986plautus,
  title={Plautus and the Theater of Disguise},
  author={Muecke, Frances},
  journal={Classical Antiquity},
  volume={5},
  number={2},
  pages={216--229},
  year={1986},
  publisher={JSTOR}
}

@book{corneliussen2008digital,
  title={Digital Culture, Play, and Identity: A World of Warcraft{\textregistered} Reader},
  author={Corneliussen, Hilde G and Rettberg, Jill Walker},
  year={2008},
  publisher={MIT Press}
}

@book{zunshine2006we,
  title={Why we read fiction: Theory of mind and the novel},
  author={Zunshine, Lisa},
  year={2006},
  publisher={Ohio State University Press}
}

@article{turing1950computing,
  title={Computing machinery and intelligence},
  author={Turing, Alan M},
  journal={Mind},
  volume={59},
  number={236},
  pages={433--460},
  year={1950},
  publisher={JSTOR}
}

@article{lebowitz1984creating,
  title={Creating characters in a story-telling universe},
  author={Lebowitz, Michael},
  journal={Poetics},
  volume={13},
  number={3},
  pages={171--194},
  year={1984},
  publisher={Elsevier}
}

@online{Plotkin:2010:Online,
author = {Plotkin, Andrew},
title = {Werewolf, http://www.eblong.com/zarf/werewolf.html},
month = feb,
year = {2010},
url = {http://www.eblong.com/zarf/werewolf.html}
}

@article{witkin2001physically,
  title={Physically based modeling: Principles and practice},
  author={Witkin, Andrew and Baraff, David},
  journal={SIGGRAPH 2001 Course Notes},
  pages={28},
  year={2001}
}


@inproceedings{jakobsen2001advanced,
  title={Advanced character physics},
  author={Jakobsen, Thomas},
  booktitle={Game Developers Conference},
  pages={383--401},
  year={2001}
}

@book{braitenberg,
  title={Vehicles: Experiments in synthetic psychology},
  author={Braitenberg, Valentino},
  year={1986},
  publisher={MIT press}
}

@article{perlin1995real,
  title={Real time responsive animation with personality},
  author={Perlin, Ken},
  journal={Visualization and Computer Graphics, IEEE Transactions on},
  volume={1},
  number={1},
  pages={5--15},
  year={1995},
  publisher={IEEE}
}

@article{heider1944experimental,
  title={An experimental study of apparent behavior},
  author={Heider, Fritz and Simmel, Marianne},
  journal={The American Journal of Psychology},
  pages={243--259},
  year={1944},
  publisher={JSTOR}
}

@inproceedings{boids,
  title={Steering behaviors for autonomous characters},
  author={Reynolds, Craig W},
  booktitle={Game developers conference},
  volume={1999},
  pages={763--782},
  year={1999}
}

@inproceedings{hecker2008real,
  title={Real-time motion retargeting to highly varied user-created morphologies},
  author={Hecker, Chris and Raabe, Bernd and Enslow, Ryan W and DeWeese, John and Maynard, Jordan and van Prooijen, Kees},
  booktitle={ACM Transactions on Graphics (TOG)},
  volume={27},
  number={3},
  pages={27},
  year={2008},
  organization={ACM}
}

@inproceedings{iscen2013controlling,
  title={Controlling tensegrity robots through evolution},
  author={Iscen, Atil and Agogino, Adrian and SunSpiral, Vytas and Tumer, Kagan},
  booktitle={Proceedings of the 15th annual conference on Genetic and evolutionary computation},
  pages={1293--1300},
  year={2013},
  organization={ACM}
}

@book{pugh1976introduction,
  title={An introduction to tensegrity},
  author={Pugh, Anthony},
  year={1976},
  publisher={Univ of California Press}
}
@inproceedings{chenney2002simulating,
  title={Simulating cartoon style animation},
  author={Chenney, Stephen and Pingel, Mark and Iverson, Rob and Szymanski, Marcin},
  booktitle={Proceedings of the 2nd international symposium on Non-photorealistic animation and rendering},
  pages={133--138},
  year={2002},
  organization={ACM}
}

@inproceedings{lin2009evaluating,
  title={Evaluating emotive character animations created with procedural animation},
  author={Lin, Yueh-Hung and Liu, Chia-Yang and Lee, Hung-Wei and Huang, Shwu-Lih and Li, Tsai-Yen},
  booktitle={Intelligent Virtual Agents},
  pages={308--315},
  year={2009},
  organization={Springer}
}

@inproceedings{lasseter1987principles,
  title={Principles of traditional animation applied to 3D computer animation},
  author={Lasseter, John},
  booktitle={ACM Siggraph Computer Graphics},
  volume={21},
  number={4},
  pages={35--44},
  year={1987},
  organization={ACM}
}

@book{thomas1995illusion,
  title={The illusion of life: Disney animation},
  author={Thomas, Frank and Johnston, Ollie and Frank. Thomas},
  year={1995},
  publisher={Hyperion New York}
}

@inproceedings{van2004bringing,
  title={Bringing robots to life: Applying principles of animation to robots},
  author={Van Breemen, AJN},
  booktitle={Proceedings of the International Conference for Human-computer Interaction, CHI2004, Vienna, Austria},
  year={2004},
  organization={Citeseer}
}

@article{ada2003expression,
  title={Expression of emotions in dance: Relation between arm movement characteristics and emotion},
  author={ADA, MISAKO SAW and Suda, Kazuhiro and Ishii, Motonobu},
  journal={Perceptual and motor skills},
  volume={97},
  number={3},
  pages={697--708},
  year={2003},
  publisher={Ammons Scientific}
}

@book{guest1998choreo,
  title={Choreo-graphics: a comparison of dance notation systems from the fifteenth century to the present},
  author={Guest, Ann Hutchinson},
  year={1998},
  publisher={Psychology Press}
}

@book{biotensegrity,
  title={Biotensegrity: The Structural Basis of Life},
  author={Scarr, Graham},
  year={2014},
  publisher={Handspring Publishing}
}


@article{takagi2001interactive,
  title={Interactive evolutionary computation: Fusion of the capabilities of EC optimization and human evaluation},
  author={Takagi, Hideyuki},
  journal={Proceedings of the IEEE},
  volume={89},
  number={9},
  pages={1275--1296},
  year={2001},
  publisher={IEEE}
}
@inproceedings{lee1995realistic,
  title={Realistic modeling for facial animation},
  author={Lee, Yuencheng and Terzopoulos, Demetri and Waters, Keith},
  booktitle={Proceedings of the 22nd annual conference on Computer graphics and interactive techniques},
  pages={55--62},
  year={1995},
  organization={ACM}
}

@article{paul2006design,
  title={Design and control of tensegrity robots for locomotion},
  author={Paul, Chandana and Valero-Cuevas, Francisco J and Lipson, Hod},
  journal={Robotics, IEEE Transactions on},
  volume={22},
  number={5},
  pages={944--957},
  year={2006},
  publisher={IEEE}
}

@inproceedings{tu1994artificial,
  title={Artificial fishes: Physics, locomotion, perception, behavior},
  author={Tu, Xiaoyuan and Terzopoulos, Demetri},
  booktitle={Proceedings of the 21st annual conference on Computer graphics and interactive techniques},
  pages={43--50},
  year={1994},
  organization={ACM}
}

@book{walkers,
  author = {{\\relax Genetic Algorithm Walkers}},
    title = {http://rednuht.org/genetic\\_walkers/},
  note = {Accessed: 2015-05-04}
}

@book{boxcar2d,
 author = {{\relax BoxCar 2D}},
  title = {http://boxcar2d.com/},
  note = {Accessed: 2015-05-04}
  }
  
@article{dryad,
  title={Exploratory modeling with collaborative design spaces},
  author={Talton, Jerry O and Gibson, Daniel and Yang, Lingfeng and Hanrahan, Pat and Koltun, Vladlen},
  journal={ACM Transactions on Graphics-TOG},
  volume={28},
  number={5},
  pages={167},
  year={2009}
}


@article{glimberg2007comparison,
  title={Comparison of ragdoll methods},
  author={Glimberg, Stefan and Engel, Morten},
  year={2007}
}

@inproceedings{mccoy2011prom,
  title={Prom Week: social physics as gameplay},
  author={McCoy, Josh and Treanor, Mike and Samuel, Ben and Mateas, Michael and Wardrip-Fruin, Noah},
  booktitle={Proceedings of the 6th International Conference on Foundations of Digital Games},
  pages={319--321},
  year={2011},
  organization={ACM}
}

@book{pugh1976introduction,
  title={An introduction to tensegrity},
  author={Pugh, Anthony},
  year={1976},
  publisher={Univ of California Press}
}

@inproceedings{jakobsen2001advanced,
  title={Advanced character physics},
  author={Jakobsen, Thomas},
  booktitle={Game Developers Conference},
  pages={383--401},
  year={2001}
}

@article{arts2000sims,
  title={The Sims},
  author={Maxis},
  journal={Electronic Arts},
  year={2000}
}

@book{guest1998choreo,
  title={Choreo-graphics: a comparison of dance notation systems from the fifteenth century to the present},
  author={Guest, Ann Hutchinson},
  year={1998},
  publisher={Psychology Press}
}
@book{thomas1995illusion,
  title={The illusion of life: Disney animation},
  author={Thomas, Frank and Johnston, Ollie and Frank. Thomas},
  year={1995},
  publisher={Hyperion New York}
}

@inproceedings{hecker2008real,
  title={Real-time motion retargeting to highly varied user-created morphologies},
  author={Hecker, Chris and Raabe, Bernd and Enslow, Ryan W and DeWeese, John and Maynard, Jordan and van Prooijen, Kees},
  booktitle={ACM Transactions on Graphics (TOG)},
  volume={27},
  number={3},
  pages={27},
  year={2008},
  organization={ACM}
}

@article{heider1944experimental,
  title={An experimental study of apparent behavior},
  author={Heider, Fritz and Simmel, Marianne},
  journal={The American Journal of Psychology},
  pages={243--259},
  year={1944},
  publisher={JSTOR}
}

@article{ada2003expression,
  title={Expression of emotions in dance: Relation between arm movement characteristics and emotion},
  author={Sawada, Misako and Suda, Kazuhiro and Ishii, Motonobu},
  journal={Perceptual and motor skills},
  volume={97},
  number={3},
  pages={697--708},
  year={2003},
  publisher={Ammons Scientific}
}

@article{perlin1995real,
  title={Real time responsive animation with personality},
  author={Perlin, Ken},
  journal={Visualization and Computer Graphics, IEEE Transactions on},
  volume={1},
  number={1},
  pages={5--15},
  year={1995},
  publisher={IEEE}
}

@incollection{dubbin2010learning,
  title={Learning to dance through interactive evolution},
  author={Dubbin, Greg A and Stanley, Kenneth O},
  booktitle={Applications of Evolutionary Computation},
  pages={331--340},
  year={2010},
  publisher={Springer}
}


@inproceedings{jadhav2012art,
  title={Art to SMart: an evolutionary computational model for BharataNatyam choreography},
  author={Jadhav, Swati and Joshi, Madhura and Pawar, Jyoti},
  booktitle={Hybrid Intelligent Systems (HIS), 2012 12th International Conference on},
  pages={384--389},
  year={2012},
  organization={IEEE}
}

@incollection{eisenmann2011creating,
  title={Creating choreography with interactive evolutionary algorithms},
  author={Eisenmann, Jonathan and Schroeder, Benjamin and Lewis, Matthew and Parent, Rick},
  booktitle={Applications of Evolutionary Computation},
  pages={293--302},
  year={2011},
  publisher={Springer}
}


@inproceedings{carlson2011scuddle,
  title={Scuddle: Generating movement catalysts for computer-aided choreography},
  author={Carlson, Kristin and Schiphorst, Thecla and Pasquier, Philippe},
  booktitle={Proceedings of the Second International Conference on Computational Creativity},
  pages={123--128},
  year={2011}
}


@article{humanGuided,
  title={Human-guided search},
  author={Klau, Gunnar W and Lesh, Neal and Marks, Joe and Mitzenmacher, Michael},
  journal={Journal of Heuristics},
  volume={16},
  number={3},
  pages={289--310},
  year={2010},
  publisher={Springer}
}

@article{reynolds1987flocks,
  title={Flocks, herds and schools: A distributed behavioral model},
  author={Reynolds, Craig W},
  journal={ACM Siggraph Computer Graphics},
  volume={21},
  number={4},
  pages={25--34},
  year={1987},
  publisher={ACM}
}

@book{braitenberg1986vehicles,
  title={Vehicles: Experiments in synthetic psychology},
  author={Braitenberg, Valentino},
  year={1986},
  publisher={MIT press}
}

@article{directManipulation,
  title={Direct Manipulation: a step beyond programming languages},
  author={Shneiderman, Ben},
  journal={Sparks of innovation in human-computer interaction},
  volume={17},
  pages={1993},
  year={1993}
}

@book{artAndFear,
  title={Art \\& fear},
  author={Bayles, David and Orland, Ted and Morey, Arthur},
  year={2012},
  publisher={Tantor Media, Incorporated}
}

@incollection{colton2012painting,
  title={The painting fool: Stories from building an automated painter},
  author={Colton, Simon},
  booktitle={Computers and creativity},
  pages={3--38},
  year={2012},
  publisher={Springer}
}
@inproceedings{geroExploration,
  title={Towards a model of exploration in computer-aided design.},
  author={Gero, John S},
  booktitle={Formal design methods for CAD},
  pages={315--336},
  year={1994}
}

@inproceedings{jokes,
  title={Unsupervised joke generation from big data.},
  author={Petrovic, Sasa and Matthews, David},
  booktitle={ACL (2)},
  pages={228--232},
  year={2013}
}

@article{shneiderman2007creativity,
  title={Creativity support tools: Accelerating discovery and innovation},
  author={Shneiderman, Ben},
  journal={Communications of the ACM},
  volume={50},
  number={12},
  pages={20--32},
  year={2007},
  publisher={ACM}
}


@article{scratch,
  title={Scratch: programming for all},
  author={Resnick, Mitchel and Maloney, John and Monroy-Hern{\\'a}ndez, Andr{\\'e}s and Rusk, Natalie and Eastmond, Evelyn and Brennan, Karen and Millner, Amon and Rosenbaum, Eric and Silver, Jay and Silverman, Brian and others},
  journal={Communications of the ACM},
  volume={52},
  number={11},
  pages={60--67},
  year={2009},
  publisher={ACM}
}

@techreport{taltonTrees,
  title={Collaborative Mapping of a Parametric Design Space},
  author={Talton, Jerry and Gibson, Daniel and Hanrahan, Pat and Koltun, Vladlen},
  year={2008},
   institution={Citeseer}
}

@article{computationalCreativity,
  title={Computational creativity: Coming of age},
  author={Colton, Simon and L{\\'o}pez de Mantaras, Ram{\\'o}n and Stock, Oliviero and others},
  journal={AI Magazine},
  volume={30},
  number={3},
  pages={11--14},
  year={2009}
}


@article{partners,
  title={How can computers be partners in the creative process: classification and commentary on the special issue},
  author={Lubart, Todd},
  journal={International Journal of Human-Computer Studies},
  volume={63},
  number={4},
  pages={365--369},
  year={2005},
  publisher={Elsevier}
}

@article{iCanMakeAnother,
  title={\`I can always make another one!'--Young musicians creating music with digital tools},
  author={Nilsson, Bo},
  journal={Musicianship in the 21st century: issues, trends and possibilities (Sydney, Australian Music Centre)},
  year={2003}
}
@inproceedings{tracery,
  title={Tracery: Approachable Story Grammar Authoring for Casual Users},
  author={Compton, Kate and Filstrup, Benjamin and Mateas, Michae and others},
  booktitle={Seventh Intelligent Narrative Technologies Workshop},
  year={2014}
}


@inproceedings{checker,
  title={Real-time motion retargeting to highly varied user-created morphologies},
  author={Hecker, Chris and Raabe, Bernd and Enslow, Ryan W and DeWeese, John and Maynard, Jordan and van Prooijen, Kees},
  booktitle={ACM Transactions on Graphics (TOG)},
  volume={27},
  pages={27},
  year={2008},
  organization={ACM}
}

@misc{nervousSystem,
title={Nervous System},
  author = {Nervous System},
year = {2015},
}

@misc{Twine,
  title={Twine},
  author={Klimas, Chris},
  note = {Accessed: 2015-02-24},
   year={2012}
}




@article{shneiderman2006creativity,
  title={Creativity support tools: Report from a US National Science Foundation sponsored workshop},
  author={Shneiderman, Ben and Fischer, Gerhard and Czerwinski, Mary and Resnick, Mitch and Myers, Brad and Candy, Linda and Edmonds, Ernest and Eisenberg, Mike and Giaccardi, Elisa and Hewett, Tom and others},
  journal={International Journal of Human-Computer Interaction},
  volume={20},
  number={2},
  pages={61--77},
  year={2006},
  publisher={Taylor \\& Francis}
}


@article{designPrinciples,
  title={Design principles for tools to support creative thinking},
  author={Resnick, Mitchel and Myers, Brad and Nakakoji, Kumiyo and Shneiderman, Ben and Pausch, Randy and Selker, Ted and Eisenberg, Mike},
  year={2005}
}

@book{flow,
  title={Flow},
  author={Csikszentmihalyi, Mihaly},
  year={2014},
  publisher={Springer}
}

@inproceedings{sentientSketchbook,
  title={Mixed-initiative Cocreativity},
  booktitle={Proceedings of the 9th Conference on the Foundations of Digital Games},
  year={2014},
  author={Yannakakis, Georgios N and Liapis, Antonios and Alexopoulos, Constantine}
}

@article{picBreeder,
  title={Picbreeder: A case study in collaborative evolutionary exploration of design space},
  author={Secretan, Jimmy and Beato, Nicholas and D'Ambrosio, David B and Rodriguez, Adelein and Campbell, Adam and Folsom-Kovarik, Jeremiah T and Stanley, Kenneth O},
  journal={Evolutionary Computation},
  volume={19},
  number={3},
  pages={373--403},
  year={2011},
  publisher={MIT Press}
}

@article{amabileMotivation,
  title={Social influences on creativity: Evaluation, coaction, and surveillance},
  author={Amabile, Teresa M and Goldfarb, Phyllis and Brackfleld, Shereen C},
  journal={Creativity research journal},
  volume={3},
  number={1},
  pages={6--21},
  year={1990},
  publisher={Taylor \& Francis}
}

@book{leonardosLaptop,
  title={Leonardo's laptop: human needs and the new computing technologies},
  author={Shneiderman, Ben},
  year={2003},
  publisher={Mit Press}
}

@article{fourTypes,
  title={Beyond big and little: The four c model of creativity.},
  author={Kaufman, James C and Beghetto, Ronald A},
  journal={Review of general psychology},
  volume={13},
  number={1},
  pages={1},
  year={2009},
  publisher={Educational Publishing Foundation}
}

@article{boden2009computerModels,
  title={Computer models of creativity},
  author={Boden, Margaret A},
  journal={AI Magazine},
  volume={30},
  number={3},
  pages={23},
  year={2009}
}

@book{beyondBoredom,
  title={Beyond boredom and anxiety.},
  author={Csikszentmihalyi, Mihaly},
  year={2000},
  publisher={Jossey-Bass}
}

@inproceedings{kuznetsov2010rise,
  title={Rise of the expert amateur: DIY projects, communities, and cultures},
  author={Kuznetsov, Stacey and Paulos, Eric},
  booktitle={Proceedings of the 6th Nordic Conference on Human-Computer Interaction: Extending Boundaries},
  pages={295--304},
  year={2010},
  organization={ACM}
}

@article{schonMaterials,
  title={Designing as reflective conversation with the materials of a design situation},
  author={Schon, Donald A},
  journal={Research in Engineering Design},
  volume={3},
  number={3},
  pages={131--147},
  year={1992},
  publisher={Springer}
}

@inproceedings{candy2002modeling,
  title={Modeling co-creativity in art and technology},
  author={Candy, Linda and Edmonds, Ernest},
  booktitle={Proceedings of the 4th conference on Creativity \\& cognition},
  pages={134--141},
  year={2002},
  organization={ACM}
}

@inproceedings{warr2005understanding,
  title={Understanding design as a social creative process},
  author={Warr, Andy and O'Neill, Eamonn},
  booktitle={Proceedings of the 5th conference on Creativity \\& cognition},
  pages={118--127},
  year={2005},
  organization={ACM}
}

@inproceedings{collectiveCreativity,
  title={Computational and collective creativity: who's being creative?},
  author={Maher, Mary Lou},
  booktitle={Proceedings of the 3rd International Conference on Computational Creativity},
  pages={67--71},
  year={2012},
}

@inproceedings{colleagues,
  title={Building Artistic Computer Colleagues with an Enactive Model of Creativity},
  author={Davis, Nicholas and Popova, Yanna and Sysoev, Ivan and Hsiao, Chih-Pin and Zhang, Dingtian and Magerko, Brian},
   booktitle={Proceedings of the 5th International Conference on Computational Creativity},
      year={2014},
}

@inproceedings{fallman2003design,
  title={Design-oriented human-computer interaction},
  author={Fallman, Daniel},
  booktitle={Proceedings of the SIGCHI conference on Human factors in computing systems},
  pages={225--232},
  year={2003},
  organization={ACM}
}

@article{candy1997computers,
  title={Computers and creativity support: knowledge, visualisation and collaboration},
  author={Candy, Linda},
  journal={Knowledge-Based Systems},
  volume={10},
  number={1},
  pages={3--13},
  year={1997},
  publisher={Elsevier}
}


@phdthesis{magicCrayons,
  title={Miniature gardens \\& magic crayons: Games, spaces, \\& worlds},
  author={Gingold, Chaim},
  year={2003},
  school={Georgia Institute of Technology}
}

@inproceedings{generativeMethods,
  title={Generative methods},
  author={Compton, Kate and Osborn, Joseph C and Mateas, Michael},
  booktitle={The Fourth Procedural Content Generation in Games workshop, PCG},
  year={2013}
}

@article{wierenga1998dependent,
  title={The dependent variable in research into the effects of creativity support systems: quality and quantity of ideas},
  author={Wierenga, Berend and Van Bruggen, Gerrit H},
  journal={MIS quarterly},
  pages={81--87},
  year={1998},
  publisher={JSTOR}
}

@article{shneiderman2007creativity,
  title={Creativity support tools: Accelerating discovery and innovation},
  author={Shneiderman, Ben},
  journal={Communications of the ACM},
  volume={50},
  number={12},
  pages={20--32},
  year={2007},
  publisher={ACM}
}


@inproceedings{treanor2012micro,
  title={The micro-rhetorics of Game-o-Matic},
  author={Treanor, Mike and Schweizer, Bobby and Bogost, Ian and Mateas, Michael},
  booktitle={Proceedings of the International Conference on the Foundations of Digital Games},
  pages={18--25},
  year={2012},
  organization={ACM}
}
@book{rogers1985procedural,
  title={Procedural elements for computer graphics},
  author={Rogers, David F and others},
  volume={103},
  year={1985},
  publisher={McGraw-Hill New York}
}
@book{nierhaus2009algorithmic,
  title={Algorithmic composition: paradigms of automated music generation},
  author={Nierhaus, Gerhard},
  year={2009},
  publisher={Springer Verlag Wien}
}
@book{cross1977automated,
  title={The automated architect},
  author={Cross, Nigel},
  year={1977},
  publisher={Viking Penguin}
}
@book{simon1969sciences,
  title={The sciences of the artificial},
  author={Simon, Herbert A},
  year={1969},
  publisher={MIT press}
}
@unpublished{diefenbach2013moonlighters,
  Author = {Diefenbach, Edward and Sennott, Michael},
  Date-Added = {2013-03-02 00:46:32 +0000},
  Date-Modified = {2013-03-02 00:50:00 +0000},
  Note = {Personal correspondence},
  Title = {The Moonlighters},
  Year = {2013}}

@article{graetz1981origin,
  Author = {Graetz, J Martin},
  Journal = {Creative Computing},
  Number = {8},
  Pages = {56--67},
  Title = {The origin of Spacewar},
  Volume = {7},
  Year = {1981}}

@article{togelius2010search,
  Author = {Togelius, Julian and Yannakakis, Georgios and Stanley, Kenneth and Browne, Cameron},
  Journal = {Applications of Evolutionary Computation},
  Pages = {141--150},
  Publisher = {Springer},
  Title = {Search-based procedural content generation},
  Year = {2010}}

@article{sundberg1976generative,
  Author = {Sundberg, Johan and Lindblom, Bj{\\"o}rn},
  Journal = {Cognition},
  Number = {1},
  Pages = {99--122},
  Publisher = {Elsevier},
  Title = {Generative theories in language and music descriptions},
  Volume = {4},
  Year = {1976}}

@article{stiny1972shape,
  Author = {Stiny, George and Gips, James},
  Journal = {Information processing},
  Number = {1460-1465},
  Publisher = {Amsterdam: North Holland},
  Title = {Shape grammars and the generative specification of painting and sculpture},
  Volume = {71},
  Year = {1972}}

@article{laske1973search,
  Author = {Laske, Otto E},
  Journal = {Perspectives of New Music},
  Number = {1/2},
  Pages = {351--378},
  Publisher = {JSTOR},
  Title = {In search of a Generative Grammar for Music},
  Volume = {12},
  Year = {1973}}
  
@inproceedings{tutenel2009rule,
  title={Rule-based layout solving and its application to procedural interior generation},
  author={Tutenel, Tim and Bidarra, Rafael and Smelik, Ruben M and de Kraker, Klaas Jan},
  booktitle={CASA Workshop on 3D Advanced Media In Gaming And Simulation},
  year={2009}
}


@conference{wright2005procedural,
  Author = {Wright, Will},
  Booktitle = {Game Developers Conference},
  Date-Added = {2013-03-01 23:39:01 +0000},
  Date-Modified = {2013-03-01 23:39:46 +0000},
  Title = {The Future of Content},
  Year = {2005}}

@article{wexler1970teaching,
  Author = {Wexler, JD},
  Journal = {International Journal of Man-Machine Studies},
  Number = {1},
  Pages = {1--27},
  Publisher = {Elsevier},
  Title = {A teaching program that generates simple arithmetic problems},
  Volume = {2},
  Year = {1970}}

@inproceedings{verma2010architectural,
  Author = {Verma, Manisha and Thakur, Manish K},
  Booktitle = {The 2nd International Conference on Computer and Automation Engineering},
  Organization = {IEEE},
  Pages = {268--275},
  Title = {Architectural space planning using Genetic Algorithms},
  Volume = {2},
  Year = {2010}}

@inproceedings{czarnecki1997beyond,
  Author = {Czarnecki, Krzysztof and Eisenecker, Ulrich W and Steyaert, Patrick},
  Booktitle = {Proceeding of the Aspect-Oriented Programming Workshop at ECOOP},
  Organization = {Citeseer},
  Pages = {1--8},
  Title = {Beyond objects: Generative programming},
  Volume = {97},
  Year = {1997}}

@inproceedings{smith2010variations,
  title={Variations forever: Flexibly generating rulesets from a sculptable design space of mini-games},
  author={Smith, Adam M and Mateas, Michael},
  booktitle={Proceedings of the IEEE Conference on Computational Intelligence and Games (CIG)},
  year={2010}
}

@article{eastman1970representations,
  Author = {Eastman, Charles M},
  Journal = {Communications of the ACM},
  Number = {4},
  Pages = {242--250},
  Publisher = {ACM},
  Title = {Representations for space planning},
  Volume = {13},
  Year = {1970}}

@inproceedings{lamstein2004search,
  Author = {Lamstein, Ari and Mateas, Michael},
  Booktitle = {Proc. of the 2004 AAAI Workshop on Challenges in Game Artificial Intelligence},
  Title = {Search-based drama management},
  Year = {2004}}

@article{michielssen1993design,
  Author = {Michielssen, Eric and Sajer, J-M and Ranjithan, S and Mittra, Raj},
  Journal = {Microwave Theory and Techniques, IEEE Transactions on},
  Number = {6},
  Pages = {1024--1031},
  Publisher = {IEEE},
  Title = {Design of lightweight, broad-band microwave absorbers using genetic algorithms},
  Volume = {41},
  Year = {1993}}

@article{chomsky1956three,
  Author = {Chomsky, Noam},
  Journal = {Information Theory, IRE Transactions on},
  Number = {3},
  Pages = {113--124},
  Publisher = {IEEE},
  Title = {Three models for the description of language},
  Volume = {2},
  Year = {1956}}

@inproceedings{Greuter:2003:RPG:604471.604490,
  Acmid = {604490},
  Address = {New York, NY, USA},
  Author = {Greuter, Stefan and Parker, Jeremy and Stewart, Nigel and Leach, Geoff},
  Booktitle = {Proceedings of the 1st international conference on Computer graphics and interactive techniques in Australasia and South East Asia},
  Doi = {10.1145/604471.604490},
  Isbn = {1-58113-578-5},
  Keywords = {LRU caching, architecture, procedural generation, real-time, view frustum filling},
  Location = {Melbourne, Australia},
  Publisher = {ACM},
  Series = {GRAPHITE '03},
  Title = {Real-time procedural generation of \`pseudo infinite' cities},
  Url = {http://doi.acm.org/10.1145/604471.604490},
  Year = {2003},
  Bdsk-Url-1 = {http://doi.acm.org/10.1145/604471.604490},
  Bdsk-Url-2 = {http://dx.doi.org/10.1145/604471.604490}}

@article{herskovits1973generation,
  Author = {Herskovits, Annette},
  Publisher = {Stanford University},
  Title = {The generation of French from a semantic representation.},
  Year = {1973}}

@book{ebert2002texturing,
  Author = {Ebert, David S and Musgrave, F Kenton and Peachey, Darwyn and Perlin, Ken and Worley, Steve},
  Publisher = {Morgan Kaufmann},
  Title = {Texturing and modeling: a procedural approach},
  Year = {2002}}

@techreport{macri2000procedural,
  Author = {Macri, D. and Pallister, K.},
  Date-Added = {2013-03-01 23:32:24 +0000},
  Date-Modified = {2013-03-02 16:37:27 +0000},
  Institution = {Intel Developer Service},
  Lastchecked = {March 1, 2013},
  Title = {Procedural 3D Content Generation},
  Url = {http://web.archive.org/web/20050105033528/http://www.intel.com/cd/ids/developer/asmo-na/eng/segments/games/resources/graphics/20247.htm?page=2},
  Year = {2000}}

@incollection{space-planning-new,
  Author = {Schneider, Sven and Fischer, Jan-Ruben and K{\\"o}nig, Reinhard},
  Booktitle = {Design Computing and Cognition '10},
  Doi = {10.1007/978-94-007-0510-4_20},
  Editor = {Gero, JohnS.},
  Isbn = {978-94-007-0509-8},
  Pages = {367-386},
  Publisher = {Springer Netherlands},
  Title = {Rethinking Automated Layout Design: Developing a Creative Evolutionary Design Method for the Layout Problems in Architecture and Urban Design},
  Url = {http://dx.doi.org/10.1007/978-94-007-0510-4_20},
  Year = {2011},
  Bdsk-Url-1 = {http://dx.doi.org/10.1007/978-94-007-0510-4_20}}

@inproceedings{smith2010tanagra,
  Author = {Smith, Gillian and Whitehead, Jim and Mateas, Michael},
  Booktitle = {Proceedings of the Fifth International Conference on the Foundations of Digital Games},
  Organization = {ACM},
  Pages = {209--216},
  Title = {Tanagra: A mixed-initiative level design tool},
  Year = {2010}}

@article{smith2011launchpad,
  Author = {Smith, Gillian and Whitehead, Jim and Mateas, Michael and Treanor, Mike and March, Jameka and Cha, Mee},
  Journal = {IEEE Transactions on Computational Intelligence and AI in Games},
  Number = {1},
  Pages = {1--16},
  Publisher = {IEEE},
  Title = {Launchpad: A Rhythm-Based Level Generator for 2-D Platformers},
  Volume = {3},
  Year = {2011}}

@inproceedings{smith2010analyzing,
  Author = {Smith, Gillian and Whitehead, Jim},
  Booktitle = {Proceedings of the 2010 Workshop on Procedural Content Generation in Games},
  Organization = {ACM},
  Pages = {4},
  Title = {Analyzing the expressive range of a level generator},
  Year = {2010}}

@article{csikszentmihalyi1996flow,
  title={Creativity: flow and the psychology of discovery and invention},
  author={Csikszentmihalyi, Mihaly},
  journal={New York: Harper Collins},
  year={1996}
}

@inproceedings{colton2014you,
  title={You can’t know my mind: a festival of computational creativity},
  author={Colton, Simon and Ventura, Dan},
  booktitle={Proceedings of the 5th International Conference on Computational Creativity},
  pages={351--354},
  year={2014}
}

@inproceedings{colton2015painting,
  title={The Painting Fool sees! new projects with the automated painter},
  author={Colton, Simon and Halskov, Jakob and Ventura, Dan and Gouldstone, Ian and Cook, Michael and Perez-Ferrer, Blanca},
  booktitle={Proceedings of the 6th International Conference on Computational Creativity},
  pages={189--196},
  year={2015}
}

@inproceedings{saunders2001digital,
  title={The digital clockwork muse: A computational model of aesthetic evolution},
  author={Saunders, Rob and Gero, John S},
  booktitle={Proceedings of the AISB},
  volume={1},
  pages={12--21},
  year={2001}
}

@article{boden1994creativity,
  title={What is creativity},
  author={Boden, Margaret A},
  journal={Dimensions of creativity},
  pages={75--117},
  year={1994}
}
@article{salah2013flow,
  title={Flow of innovation in deviantArt: following artists on an online social network site},
  author={Salah, Alkim Almila Akdag and Salah, Albert Ali},
  journal={Mind \\& Society},
  volume={12},
  number={1},
  pages={137--149},
  year={2013},
  publisher={Springer}
}

@article{accominotti2009creativity,
  title={Creativity from interaction: Artistic movements and the creativity careers of modern painters},
  author={Accominotti, Fabien},
  journal={Poetics},
  volume={37},
  number={3},
  pages={267--294},
  year={2009},
  publisher={Elsevier}
}

@book{csikszentmihalyi2014society,
  title={Society, culture, and person: A systems view of creativity},
  author={Csikszentmihalyi, Mihaly},
  year={2014},
  publisher={Springer}
}

@article{cohenObit,
title={Harold Cohen, computer-generated art pioneer, 87},
author={Grimes, William},
journal={The San Diego Union Tribune},
year={2016}
}

@article{artInBox,
  title={Engineering Spore},
  author={Kushner, David},
  journal={IEEE Spectrum},
  volume={45},
  number={9},
  year={2008},
  publisher={IEEE}
}

@inproceedings{colton2015painting,
  title={The Painting Fool sees! new projects with the automated painter},
  author={Colton, Simon and Halskov, Jakob and Ventura, Dan and Gouldstone, Ian and Cook, Michael and Perez-Ferrer, Blanca},
  booktitle={Proceedings of the 6th International Conference on Computational Creativity},
  pages={189--196},
  year={2015}
}

@inproceedings{casualcreators,
  title={Casual creators},
  author={Compton, Kate and Mateas, Michael},
  booktitle={Proceedings of the International Conference on Computational Creativity},
  year={2015}
}

@inproceedings{tracery,
  title={Tracery: Approachable story grammar authoring for casual users},
  author={Compton, Kate and Filstrup, Benjamin and others},
  booktitle={Seventh Intelligent Narrative Technologies Workshop},
  year={2014}
}

@article{implicationsSystemsCreativity,
  title={16 Implications of a Systems Perspective for the Study of Creativity},
  author={Csikszentmihalyi, Mihaly},
  journal={Handbook of creativity},
  volume={313},
  year={1999},
  publisher={Cambridge Univ Pr}
}`);

}