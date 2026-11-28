/* ==========================================================================
   AURA // DAILY OS
   Daily discipline, streaks, challenges and programs. Vanilla JS, no deps.
   Storage: localStorage "aura.daily.v3" (reads the old ARENA keys once)
   ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'aura.daily.v3';
  var LEGACY_KEYS = ['arena.daily.v2', 'arena.daily.v1'];
  var MAX_TITLE = 80;
  var MAX_WHY = 120;
  var MAX_ITEMS = 12;
  var MAX_STREAK = 3650;
  var MIN_DAYS = 2;
  var MAX_DAYS = 90;
  var WON_AT = 67;
  var ACCENTS = [
    ['#8b5cf6', '#f5c94e'],
    ['#f5c94e', '#ff9f1c'],
    ['#ef7ac0', '#8b5cf6'],
    ['#22c55e', '#00e676']
  ];

  /* Five coverage buckets: the builder judges a session by what it trains,
     not by how many exercises were thrown at it. */
  var MUSCLE_GROUPS = [
    { key: 'chest', label: 'Chest' },
    { key: 'shoulders', label: 'Shoulders' },
    { key: 'triceps', label: 'Triceps' },
    { key: 'core', label: 'Core / Back' },
    { key: 'legs', label: 'Legs / Glutes' }
  ];

  function groupLabel(key) {
    for (var i = 0; i < MUSCLE_GROUPS.length; i += 1) {
      if (MUSCLE_GROUPS[i].key === key) return MUSCLE_GROUPS[i].label;
    }
    return '';
  }

  function isGroup(key) {
    return !!groupLabel(key);
  }

  /* Equipment-free library. `sets`/`reps` are only defaults; a hold counts its
     reps as seconds, so a 30-second plank reads 3 × 30s. `also` adds a second
     muscle bucket to a compound movement. */
  var EXERCISE_LIBRARY = [
    { name: 'Push-Up', group: 'chest', sets: 3, reps: 12, motion: 'push',
      cue: 'Hands under the shoulders. Lower until the elbows reach 90°, then press the floor away.' },
    { name: 'Wide Push-Up', group: 'chest', sets: 3, reps: 12, motion: 'push',
      cue: 'Hands wider than the shoulders, elbows out. Lower the chest, then squeeze back up.' },
    { name: 'Diamond Push-Up', group: 'chest', also: ['triceps'], sets: 3, reps: 10, motion: 'push',
      cue: 'Thumbs and index fingers touch. Keep the elbows close as the chest lowers.' },
    { name: 'Decline Push-Up', group: 'chest', also: ['shoulders'], sets: 3, reps: 10, motion: 'push',
      cue: 'Feet on a chair, hands below. Lower the chest toward the floor and press up.' },
    { name: 'Archer Push-Up', group: 'chest', sets: 3, reps: 8, motion: 'push',
      cue: 'One arm wide and straight, the other bent. Shift toward the bent arm, then press back.' },
    { name: 'Pike Push-Up', group: 'shoulders', also: ['triceps'], sets: 3, reps: 8, motion: 'push',
      cue: 'Hips high, hands and feet planted. Bend the elbows and lower the crown toward the floor.' },
    { name: 'Shoulder Tap', group: 'shoulders', also: ['core'], sets: 3, reps: 16, motion: 'tap',
      cue: 'Hold a plank. Tap one shoulder, then the other, without letting the hips rock.' },
    { name: 'Wall Handstand Hold', group: 'shoulders', sets: 3, reps: 30, unit: 'sec', motion: 'raise',
      cue: 'Walk the feet up the wall, hands under the shoulders. Press tall and breathe.' },
    { name: 'Bench Dip', group: 'triceps', sets: 3, reps: 12, motion: 'push',
      cue: 'Hands on a chair behind you, legs forward. Bend the elbows to lower, then press up.' },
    { name: 'Close-Grip Push-Up', group: 'triceps', also: ['chest'], sets: 3, reps: 10, motion: 'push',
      cue: 'Hands under the chest, elbows brushing the sides. Press up without flaring.' },
    { name: 'Plank', group: 'core', sets: 3, reps: 45, unit: 'sec', motion: 'plank',
      cue: 'Elbows under the shoulders, ribs down, glutes tight. Hold one straight line.' },
    { name: 'Hollow Hold', group: 'core', sets: 3, reps: 30, unit: 'sec', motion: 'plank',
      cue: 'Press the low back into the floor. Lift the shoulders and legs a little and hold.' },
    { name: 'Superman Hold', group: 'core', sets: 3, reps: 30, unit: 'sec', motion: 'plank',
      cue: 'Face down, arms forward. Lift the hands, chest and feet, then hold.' },
    { name: 'Reverse Snow Angel', group: 'core', sets: 3, reps: 12, motion: 'sweep',
      cue: 'Lie face down. Sweep straight arms from overhead to the hips and back.' },
    { name: 'Dead Bug', group: 'core', sets: 3, reps: 10, motion: 'climber',
      cue: 'On your back, arms and knees up. Lower the opposite arm and leg slowly, then switch.' },
    { name: 'Bird Dog', group: 'core', sets: 3, reps: 10, motion: 'climber',
      cue: 'On all fours. Reach one arm and the opposite leg long, hold, then switch sides.' },
    { name: 'Mountain Climber', group: 'core', also: ['legs'], sets: 3, reps: 30, unit: 'sec', motion: 'climber',
      cue: 'Plank position. Drive one knee toward the chest, then alternate without bouncing.' },
    { name: 'Squat', group: 'legs', sets: 4, reps: 15, motion: 'squat',
      cue: 'Feet shoulder-width, chest tall. Sit the hips back and down, then stand.' },
    { name: 'Reverse Lunge', group: 'legs', sets: 3, reps: 10, motion: 'lunge',
      cue: 'Step one foot back, drop the back knee toward the floor, then drive up.' },
    { name: 'Glute Bridge', group: 'legs', sets: 3, reps: 15, motion: 'bridge',
      cue: 'On your back, feet planted. Press the hips up until the body is one line.' },
    { name: 'Bulgarian Split Squat', group: 'legs', sets: 3, reps: 10, motion: 'lunge',
      cue: 'Back foot on a chair, front foot forward. Lower straight down, then rise.' },
    { name: 'Calf Raise', group: 'legs', sets: 3, reps: 20, motion: 'calf',
      cue: 'Stand tall, press up onto the toes, pause at the top, then lower slowly.' },
    { name: 'Jump Squat', group: 'legs', sets: 3, reps: 12, motion: 'squat',
      cue: 'Squat down, then jump. Land soft with bent knees and reset.' },
    { name: 'Wall Sit', group: 'legs', sets: 3, reps: 45, unit: 'sec', motion: 'squat',
      cue: 'Back on the wall, thighs parallel to the floor. Hold and breathe.' }
  ];

  /* Legacy/gym names never stored a bucket, so read one from the movement. */
  function groupFromName(name) {
    var text = String(name || '').toLowerCase();
    if (/push-up|pushup|press|push press|fly|chest/.test(text)) {
      if (/overhead|shoulder|pike|handstand/.test(text)) return 'shoulders';
      if (/tricep|dip|diamond|close-grip/.test(text)) return 'triceps';
      return 'chest';
    }
    if (/tricep|dip|skull/.test(text)) return 'triceps';
    if (/shoulder|lateral raise|face pull/.test(text)) return 'shoulders';
    if (/squat|lunge|leg|calf|glute|hip thrust|deadlift|step-up/.test(text)) return 'legs';
    if (/plank|hollow|superman|dead bug|bird dog|climber|crunch|row|pull|curl|back|core|angel/.test(text)) return 'core';
    return '';
  }

  function libraryEntry(name) {
    var key = String(name || '').toLowerCase();
    for (var i = 0; i < EXERCISE_LIBRARY.length; i += 1) {
      if (EXERCISE_LIBRARY[i].name.toLowerCase() === key) return EXERCISE_LIBRARY[i];
    }
    return null;
  }

  /* Custom/legacy movements still get a demo: read the motion from the name. */
  function exerciseMotion(exercise) {
    var entry = libraryEntry(exercise.name);
    if (entry && entry.motion) return entry.motion;
    var text = String(exercise.name || '').toLowerCase();
    if (/climber/.test(text)) return 'climber';
    if (/bridge|hip thrust/.test(text)) return 'bridge';
    if (/lunge|split squat|step-up/.test(text)) return 'lunge';
    if (/calf/.test(text)) return 'calf';
    if (/handstand|overhead|wall walk/.test(text)) return 'raise';
    if (/squat|wall sit|chair/.test(text)) return 'squat';
    if (/plank|hold|hollow|dead bug|bird dog/.test(text)) return 'plank';
    if (/angel|superman|reach/.test(text)) return 'sweep';
    if (/dip|push|press|fly/.test(text)) return 'push';
    return 'push';
  }

  function exerciseCue(exercise) {
    var entry = libraryEntry(exercise.name);
    if (entry && entry.cue) return entry.cue;
    return 'Move slowly through a full range. Brace the core and keep the joints stacked.';
  }

  /* -------------------------- muscle body map ---------------------------- */

  /* One front-view silhouette; each muscle group is a separate shape so it can
     light up without any label sprawl. */
  var BODY_MUSCLES = [
    { key: 'legs', shapes: [
      '<path d="M51.5 126 L58.5 126 L57 160 L55.5 176 L52 176 L50.5 160 Z"/>',
      '<path d="M61.5 126 L68.5 126 L69.5 160 L68 176 L64.5 176 L63 160 Z"/>'
    ] },
    { key: 'core', shapes: [
      '<path d="M52.5 78 Q60 74.5 67.5 78 L66.5 112 Q60 117 53.5 112 Z"/>'
    ] },
    { key: 'chest', shapes: [
      '<path d="M49.5 57 Q54 53.5 59 57 L59 68 Q54 71.5 49.5 67 Z"/>',
      '<path d="M70.5 57 Q66 53.5 61 57 L61 68 Q66 71.5 70.5 67 Z"/>'
    ] },
    { key: 'shoulders', shapes: [
      '<ellipse cx="43" cy="50.5" rx="8.2" ry="6.2" transform="rotate(-26 43 50.5)"/>',
      '<ellipse cx="77" cy="50.5" rx="8.2" ry="6.2" transform="rotate(26 77 50.5)"/>'
    ] },
    { key: 'triceps', shapes: [
      '<path d="M35.8 63.5 L40.2 66 L36.4 86 L31.6 82.2 Z"/>',
      '<path d="M84.2 63.5 L79.8 66 L83.6 86 L88.4 82.2 Z"/>'
    ] }
  ];

  function muscleDiagram(lit) {
    var on = {};
    (lit || []).forEach(function (key) { on[key] = true; });
    var label = (lit && lit.length)
      ? 'Muscle map: ' + lit.map(groupLabel).join(', ')
      : 'Muscle map: nothing targeted yet';

    var svg = '<svg class="bodymap" viewBox="0 0 120 224" role="img" aria-label="' +
      label + '">';
    svg += '<g class="body-base" aria-hidden="true">' +
      '<circle class="body-head" cx="60" cy="23" r="11.5"/>' +
      '<path class="body-head" d="M55 31 h10 l1 10 h-12 Z"/>' +
      '<path class="body-fill" d="M45 43 C47 39 73 39 75 43 L78 70 C78 76 74 79 73 83 ' +
      'L72 110 C72 120 66 124 60 124 C54 124 48 120 48 110 L47 83 C46 79 42 76 42 70 Z"/>' +
      '<line class="body-seam" x1="60" y1="44" x2="60" y2="120"/>' +
      '<path class="body-limb" d="M46 47 L36 73 L31 103"/>' +
      '<path class="body-limb" d="M74 47 L84 73 L89 103"/>' +
      '<path class="body-limb" d="M54.5 122 L52 158 L51.5 200"/>' +
      '<path class="body-limb" d="M65.5 122 L68 158 L68.5 200"/>' +
      '</g>';
    svg += '<g class="body-muscles" aria-hidden="true">';
    BODY_MUSCLES.forEach(function (group) {
      var cls = 'muscle' + (on[group.key] ? ' is-on' : '');
      group.shapes.forEach(function (shape) {
        svg += shape.replace('<path ', '<path class="' + cls + '" ')
          .replace('<ellipse ', '<ellipse class="' + cls + '" ');
      });
    });
    svg += '</g></svg>';
    return svg;
  }

  /* --------------------------- movement demos ---------------------------- */

  /* A tiny stroke rig with a few joints. Poses come from MOTION_RIGS; SMIL
     animates the joints, so the demo also runs offline inside the cached app. */
  var MOTION_LABELS = {
    push: 'Press', plank: 'Hold', climber: 'Drive', squat: 'Squat',
    lunge: 'Lunge', bridge: 'Lift', sweep: 'Sweep', tap: 'Tap',
    raise: 'Reach', calf: 'Rise'
  };

  var MOTION_RIGS = {
    push: {
      posture: 'floor',
      joints: {
        bob: [{ type: 'translate', values: '0 0;0 0;0 15;0 15;0 0', keyTimes: '0;0.14;0.42;0.62;1', dur: '2.8s' }],
        arm: [{ type: 'rotate', values: '0;0;10;10;0', keyTimes: '0;0.14;0.42;0.62;1', dur: '2.8s' }],
        fore: [{ type: 'rotate', values: '0;0;-74;-74;0', keyTimes: '0;0.14;0.42;0.62;1', dur: '2.8s' }]
      }
    },
    plank: {
      posture: 'floor',
      joints: {
        bob: [{ type: 'translate', values: '0 0;0 3;0 0', keyTimes: '0;0.5;1', dur: '4s' }],
        fore: [{ type: 'rotate', values: '0;-2;0', keyTimes: '0;0.5;1', dur: '4s' }]
      }
    },
    climber: {
      posture: 'floor',
      joints: {
        legL: [{ type: 'rotate', values: '0;-34;0', keyTimes: '0;0.5;1', dur: '1.1s' }],
        shinL: [{ type: 'rotate', values: '0;52;0', keyTimes: '0;0.5;1', dur: '1.1s' }],
        legR: [{ type: 'rotate', values: '0;30;0', keyTimes: '0;0.5;1', dur: '1.1s', begin: '-0.55s' }],
        shinR: [{ type: 'rotate', values: '0;-34;0', keyTimes: '0;0.5;1', dur: '1.1s', begin: '-0.55s' }],
        bob: [{ type: 'translate', values: '0 0;0 -2;0 0', keyTimes: '0;0.5;1', dur: '1.1s' }]
      }
    },
    tap: {
      posture: 'floor',
      joints: {
        bob: [{ type: 'translate', values: '0 0;0 1;0 0', keyTimes: '0;0.5;1', dur: '2.4s' }],
        fore: [{ type: 'rotate', values: '0;0;-58;0;0', keyTimes: '0;0.2;0.45;0.72;1', dur: '2.4s' }],
        head: [{ type: 'rotate', values: '0;0;6;0;0', keyTimes: '0;0.2;0.45;0.72;1', dur: '2.4s' }]
      }
    },
    sweep: {
      posture: 'floor',
      joints: {
        bob: [{ type: 'translate', values: '0 0;0 2;0 0', keyTimes: '0;0.5;1', dur: '3.4s' }],
        arm: [{ type: 'rotate', values: '0;-62;0', keyTimes: '0;0.5;1', dur: '3.4s' }],
        fore: [{ type: 'rotate', values: '0;-14;0', keyTimes: '0;0.5;1', dur: '3.4s' }]
      }
    },
    bridge: {
      posture: 'floor',
      joints: {
        bob: [{ type: 'translate', values: '0 0;0 -22;0 0', keyTimes: '0;0.45;1', dur: '3s' }],
        legL: [{ type: 'rotate', values: '0;44;0', keyTimes: '0;0.45;1', dur: '3s' }],
        shinL: [{ type: 'rotate', values: '0;-46;0', keyTimes: '0;0.45;1', dur: '3s' }],
        legR: [{ type: 'rotate', values: '0;48;0', keyTimes: '0;0.45;1', dur: '3s' }],
        shinR: [{ type: 'rotate', values: '0;-50;0', keyTimes: '0;0.45;1', dur: '3s' }]
      }
    },
    squat: {
      posture: 'stand',
      joints: {
        bob: [{ type: 'translate', values: '0 0;0 16;0 16;0 0', keyTimes: '0;0.32;0.66;1', dur: '3s' }],
        legL: [{ type: 'rotate', values: '0;30;30;0', keyTimes: '0;0.32;0.66;1', dur: '3s' }],
        legR: [{ type: 'rotate', values: '0;28;28;0', keyTimes: '0;0.32;0.66;1', dur: '3s' }],
        shinL: [{ type: 'rotate', values: '0;-60;-60;0', keyTimes: '0;0.32;0.66;1', dur: '3s' }],
        shinR: [{ type: 'rotate', values: '0;-58;-58;0', keyTimes: '0;0.32;0.66;1', dur: '3s' }],
        armL: [{ type: 'rotate', values: '0;-75;-75;0', keyTimes: '0;0.32;0.66;1', dur: '3s' }],
        armR: [{ type: 'rotate', values: '0;-70;-70;0', keyTimes: '0;0.32;0.66;1', dur: '3s' }]
      }
    },
    lunge: {
      posture: 'stand',
      joints: {
        bob: [{ type: 'translate', values: '0 0;0 10;0 10;0 0', keyTimes: '0;0.32;0.62;1', dur: '3.4s' }],
        legL: [{ type: 'rotate', values: '0;-38;-38;0', keyTimes: '0;0.32;0.62;1', dur: '3.4s' }],
        shinL: [{ type: 'rotate', values: '0;38;38;0', keyTimes: '0;0.32;0.62;1', dur: '3.4s' }],
        legR: [{ type: 'rotate', values: '0;26;26;0', keyTimes: '0;0.32;0.62;1', dur: '3.4s' }],
        shinR: [{ type: 'rotate', values: '0;10;10;0', keyTimes: '0;0.32;0.62;1', dur: '3.4s' }],
        armL: [{ type: 'rotate', values: '0;-30;-30;0', keyTimes: '0;0.32;0.62;1', dur: '3.4s' }],
        armR: [{ type: 'rotate', values: '0;-24;-24;0', keyTimes: '0;0.32;0.62;1', dur: '3.4s' }]
      }
    },
    raise: {
      posture: 'stand',
      joints: {
        bob: [{ type: 'translate', values: '0 0;0 -3;0 0', keyTimes: '0;0.5;1', dur: '3.4s' }],
        armL: [{ type: 'rotate', values: '0;165;165;0', keyTimes: '0;0.35;0.7;1', dur: '3.4s' }],
        foreL: [{ type: 'rotate', values: '0;-6;-6;0', keyTimes: '0;0.35;0.7;1', dur: '3.4s' }],
        armR: [{ type: 'rotate', values: '0;158;158;0', keyTimes: '0;0.35;0.7;1', dur: '3.4s' }]
      }
    },
    calf: {
      posture: 'stand',
      joints: {
        bob: [{ type: 'translate', values: '0 0;0 -6;0 0', keyTimes: '0;0.5;1', dur: '1.9s' }],
        armL: [{ type: 'rotate', values: '0;6;0', keyTimes: '0;0.5;1', dur: '1.9s' }],
        armR: [{ type: 'rotate', values: '0;5;0', keyTimes: '0;0.5;1', dur: '1.9s' }]
      }
    }
  };

  var activeJoints = null;

  function animTag(anim) {
    var count = anim.values.split(';').length;
    var times = anim.keyTimes;
    if (!times) {
      times = [];
      for (var i = 0; i < count; i += 1) {
        times.push((i / (count - 1)).toFixed(3));
      }
      times = times.join(';');
    }
    var splines = [];
    for (var j = 0; j < count - 1; j += 1) splines.push('0.45 0 0.55 1');
    return '<animateTransform attributeName="transform" attributeType="XML" type="' +
      anim.type + '" values="' + anim.values + '" keyTimes="' + times +
      '" calcMode="spline" keySplines="' + splines.join(';') + '" dur="' +
      (anim.dur || '2.8s') + '"' + (anim.begin ? ' begin="' + anim.begin + '"' : '') +
      ' repeatCount="indefinite"/>';
  }

  function jointAnims(key) {
    var list = activeJoints && activeJoints[key];
    if (!list) return '';
    return list.map(animTag).join('');
  }

  function joint(x, y, key, inner) {
    var anims = jointAnims(key);
    return '<g transform="translate(' + x + ' ' + y + ')">' +
      (anims ? '<g>' + anims + inner + '</g>' : inner) + '</g>';
  }

  function seg(len) {
    return '<line class="fig-limb" x1="0" y1="0" x2="0" y2="' + len + '"/>';
  }

  /* Side view for the standing movements: a squat, lunge or calf raise reads
     instantly from the side, which a front silhouette cannot do. The trunk is
     a true vertical and every joint stacks over the floor. */
  function standFigure() {
    return '<g class="fig-bob">' + jointAnims('bob') +
      joint(104, 28, 'head', '<circle class="fig-head" r="12"/>' +
        '<path class="fig-face" d="M-7 -3 l-8 3 8 3"/>') +
      '<line class="fig-neck" x1="104" y1="40" x2="104" y2="50"/>' +
      '<line class="fig-trunk" x1="104" y1="50" x2="104" y2="110"/>' +
      joint(98, 108, 'legR', seg(36) + joint(0, 36, 'shinR',
        seg(32) + '<line class="fig-foot" x1="-2" y1="0" x2="12" y2="0"/>')) +
      joint(110, 108, 'legL', seg(36) + joint(0, 36, 'shinL',
        seg(32) + '<line class="fig-foot" x1="-2" y1="0" x2="12" y2="0"/>')) +
      joint(108, 58, 'armL', seg(24) + joint(0, 24, 'foreL',
        seg(22) + '<circle class="fig-hand" cy="24" r="4"/>')) +
      joint(100, 58, 'armR', '<line class="fig-limb is-back" x1="0" y1="0" x2="0" y2="24"/>' +
        joint(0, 24, 'foreR', '<line class="fig-limb is-back" x1="0" y1="0" x2="0" y2="22"/>')) +
      '</g>' +
      '<line class="fig-floor" x1="46" y1="180" x2="160" y2="180"/>';
  }

  function floorFigure() {
    return '<g class="fig-bob">' + jointAnims('bob') +
      '<line class="fig-trunk" x1="54" y1="144" x2="128" y2="132"/>' +
      joint(146, 122, 'head', '<circle class="fig-head" r="12"/>' +
        '<path class="fig-face" d="M8 -3 l7 3 -7 3"/>') +
      joint(56, 146, 'legR', '<line class="fig-limb is-back" x1="0" y1="0" x2="-30" y2="20"/>' +
        joint(-30, 20, 'shinR', '<line class="fig-limb is-back" x1="0" y1="0" x2="-14" y2="18"/>')) +
      joint(52, 143, 'legL', '<line class="fig-limb" x1="0" y1="0" x2="-30" y2="21"/>' +
        joint(-30, 21, 'shinL', '<line class="fig-limb" x1="0" y1="0" x2="-14" y2="18"/>' +
          '<line class="fig-foot" x1="-5" y1="0" x2="8" y2="0"/>')) +
      joint(126, 133, 'arm', seg(20) + joint(0, 20, 'fore',
        seg(20) + '<circle class="fig-hand" cy="22" r="4.2"/>')) +
      '</g>' +
      '<line class="fig-floor" x1="16" y1="182" x2="184" y2="182"/>';
  }

  function exerciseFigure(motionKey) {
    var motion = MOTION_RIGS[motionKey] || MOTION_RIGS.push;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    activeJoints = reduce ? null : motion.joints;
    var floor = motion.posture === 'floor';
    var inner = floor ? floorFigure() : standFigure();
    /* Floor work faces left as well, so a push-up reads the same way as the
       tab icon instead of mirroring it. */
    if (floor) inner = '<g transform="translate(200 0) scale(-1 1)">' + inner + '</g>';
    activeJoints = null;
    return '<svg class="demo-figure" viewBox="' +
      (floor ? '0 104 200 84' : '20 4 164 192') +
      '" role="img" aria-label="' + (MOTION_LABELS[motionKey] || 'Movement') +
      ' demonstration">' + inner + '</svg>';
  }

  var CHECK_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M5.5 12.8 9.8 17.1 18.5 7.6"/></svg>';

  var X_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
    'stroke-linecap="round" aria-hidden="true">' +
    '<path d="M6 6l12 12M18 6 6 18"/></svg>';

  var EDIT_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 20h4.2L19 9.2a2.1 2.1 0 0 0 0-3l-1.2-1.2a2.1 2.1 0 0 0-3 0L4 15.8V20Z"/>' +
    '<path d="m13.6 6.4 4 4"/></svg>';

  var DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var DAY_LABELS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  var els = {
    topMeta: document.getElementById('topMeta'),
    perfectPill: document.getElementById('perfectPill'),
    perfectCount: document.getElementById('perfectCount'),
    weekStrip: document.getElementById('weekStrip'),
    progressGlow: document.getElementById('progressGlow'),
    progressDate: document.getElementById('progressDate'),
    progressDone: document.getElementById('progressDone'),
    progressTotal: document.getElementById('progressTotal'),
    progressPct: document.getElementById('progressPct'),
    progressPctNum: document.getElementById('progressPctNum'),
    progressVerdict: document.getElementById('progressVerdict'),
    scale: document.getElementById('scale'),
    scaleFill: document.getElementById('scaleFill'),
    scaleMarker: document.getElementById('scaleMarker'),
    scaleStatus: document.getElementById('scaleStatus'),
    restToggle: document.getElementById('restToggle'),
    restToggleText: document.getElementById('restToggleText'),
    restToggleIcon: document.getElementById('restToggleIcon'),
    restState: document.getElementById('restState'),
    restStateCount: document.getElementById('restStateCount'),
    focusSub: document.getElementById('focusSub'),
    focusModeNote: document.getElementById('focusModeNote'),
    focusSwitch: document.getElementById('focusSwitch'),
    focusSwitchText: document.getElementById('focusSwitchText'),
    planList: document.getElementById('planList'),
    planEmpty: document.getElementById('planEmpty'),
    planCount: document.getElementById('planCount'),
    nnList: document.getElementById('nnList'),
    nnEmpty: document.getElementById('nnEmpty'),
    nnCount: document.getElementById('nnCount'),
    challengeTodaySection: document.getElementById('challengeTodaySection'),
    challengeTodayList: document.getElementById('challengeTodayList'),
    challengeTodayCount: document.getElementById('challengeTodayCount'),
    addBtn: document.getElementById('addBtn'),
    addHabitBtn: document.getElementById('addHabitBtn'),
    editBtn: document.getElementById('editBtn'),
    viewToday: document.getElementById('viewToday'),
    viewChallenges: document.getElementById('viewChallenges'),
    viewCalendar: document.getElementById('viewCalendar'),
    calPrev: document.getElementById('calPrev'),
    calNext: document.getElementById('calNext'),
    calMonth: document.getElementById('calMonth'),
    calTally: document.getElementById('calTally'),
    calWins: document.getElementById('calWins'),
    calLosses: document.getElementById('calLosses'),
    calRest: document.getElementById('calRest'),
    calWinWord: document.getElementById('calWinWord'),
    calLossWord: document.getElementById('calLossWord'),
    calRestWord: document.getElementById('calRestWord'),
    calSub: document.getElementById('calSub'),
    calWeekdays: document.getElementById('calWeekdays'),
    calGrid: document.getElementById('calGrid'),
    challengeList: document.getElementById('challengeList'),
    challengesEmpty: document.getElementById('challengesEmpty'),
    addChallengeBtn: document.getElementById('addChallengeBtn'),
    editChallenges: document.getElementById('editChallenges'),
    tabbar: document.getElementById('tabbar'),
    boot: document.getElementById('boot'),
    ptr: document.getElementById('ptr'),
    ptrText: document.getElementById('ptrText'),
    sheet: document.getElementById('sheet'),
    sheetVeil: document.getElementById('sheetVeil'),
    sheetPanel: document.getElementById('sheetPanel'),
    sheetTitle: document.getElementById('sheetTitle'),
    sheetClose: document.getElementById('sheetClose'),
    sheetCancel: document.getElementById('sheetCancel'),
    sheetDelete: document.getElementById('sheetDelete'),
    confirm: document.getElementById('confirm'),
    confirmVeil: document.getElementById('confirmVeil'),
    confirmTitle: document.getElementById('confirmTitle'),
    confirmItem: document.getElementById('confirmItem'),
    confirmNote: document.getElementById('confirmNote'),
    confirmHold: document.getElementById('confirmHold'),
    confirmHoldText: document.getElementById('confirmHoldText'),
    confirmCancel: document.getElementById('confirmCancel'),
    taskForm: document.getElementById('taskForm'),
    fieldTitle: document.getElementById('fieldTitle'),
    fieldWhy: document.getElementById('fieldWhy'),
    fieldTime: document.getElementById('fieldTime'),
    fieldRecurring: document.getElementById('fieldRecurring'),
    formError: document.getElementById('formError'),
    labelTitle: document.getElementById('labelTitle'),
    labelWhy: document.getElementById('labelWhy'),
    labelItems: document.getElementById('labelItems'),
    taskExtras: document.getElementById('taskExtras'),
    trackExtras: document.getElementById('trackExtras'),
    trackDates: document.getElementById('trackDates'),
    challengeModeField: document.getElementById('challengeModeField'),
    challengeModeHint: document.getElementById('challengeModeHint'),
    fieldDuration: document.getElementById('fieldDuration'),
    fieldItems: document.getElementById('fieldItems'),
    fieldStartDate: document.getElementById('fieldStartDate'),
    fieldEndDate: document.getElementById('fieldEndDate'),
    dateHint: document.getElementById('dateHint'),
    studio: document.getElementById('studio'),
    studioBody: document.getElementById('studioBody'),
    studioFoot: document.getElementById('studioFoot'),
    studioTitle: document.getElementById('studioTitle'),
    studioKicker: document.getElementById('studioKicker'),
    studioClose: document.getElementById('studioClose'),
    demo: document.getElementById('demo'),
    demoVeil: document.getElementById('demoVeil'),
    demoPanel: document.getElementById('demoPanel'),
    demoClose: document.getElementById('demoClose'),
    demoKicker: document.getElementById('demoKicker'),
    demoTitle: document.getElementById('demoTitle'),
    demoStage: document.getElementById('demoStage'),
    demoBody: document.getElementById('demoBody'),
    demoTags: document.getElementById('demoTags'),
    demoCue: document.getElementById('demoCue'),
    demoDose: document.getElementById('demoDose'),
    toast: document.getElementById('toast')
  };

  var state = loadState();
  var todayKey = keyOf(new Date());
  var selectedKey = todayKey;
  var view = state.view || 'today';
  var calCursor = (function () {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  })();
  var editMode = false;
  var manageChallenges = false;
  var editingId = null;
  var sheetMode = 'task';
  var sheetChallengeMode = 'habit';
  var newRecurring = false;
  var toastTimer = 0;

  /* Build cards remember whether their day plan is unfolded, so a repaint
     never snaps an open plan shut. */
  var openBuildCards = {};

  /* ------------------------------- helpers ------------------------------- */

  function uid() {
    return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function keyOf(date) {
    var d = new Date(date);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function fromKey(key) {
    var parts = String(key).split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function shiftKey(key, days) {
    var d = fromKey(key);
    d.setDate(d.getDate() + days);
    return keyOf(d);
  }

  function daysBetween(a, b) {
    var A = fromKey(a);
    var B = fromKey(b);
    var utcA = Date.UTC(A.getFullYear(), A.getMonth(), A.getDate());
    var utcB = Date.UTC(B.getFullYear(), B.getMonth(), B.getDate());
    return Math.round((utcB - utcA) / 86400000);
  }

  function trimText(value, max) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function normalizeTime(value) {
    var t = String(value == null ? '' : value).trim();
    return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(t) ? t : '';
  }

  function clampDays(value) {
    var n = parseInt(value, 10);
    if (!n || n < MIN_DAYS) n = 7;
    return Math.min(MAX_DAYS, Math.max(MIN_DAYS, n));
  }

  function validDateKey(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  }

  function shortDate(key) {
    if (!key) return '—';
    var d = fromKey(key);
    var opts = { month: 'short', day: 'numeric' };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString(undefined, opts);
  }

  function makeEl(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  /* Direction of the first strong character, so a Hebrew card lays out RTL
     and an English one lays out LTR — mirrors dir="auto" for container order. */
  var RTL_CHAR = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
  var STRONG_CHAR = /[A-Za-z\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

  function textDir(text) {
    var strong = String(text || '').match(STRONG_CHAR);
    return strong && RTL_CHAR.test(strong[0]) ? 'rtl' : 'ltr';
  }

  /* A habit keeps a stable key across renames, so its streak follows the
     routine itself instead of a raw record id. */
  function streakKeyFor(title) {
    return String(title == null ? '' : title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  function taskKey(task) {
    return (task && task.key) || streakKeyFor(task && task.title);
  }

  /* -------------------------------- seed --------------------------------- */

  function seedTasks() {
    var now = Date.now();
    var today = keyOf(new Date(now));
    function task(title, why, time, recurring) {
      return {
        id: uid(), title: title, why: why, time: time, recurring: recurring,
        createdAt: now, date: recurring ? '' : today
      };
    }
    return [
      task('Morning workout', 'Builds discipline and stamina — starts the day strong', '06:30', false),
      task('Deep work — 90 minutes', 'Sharpens focus and compounds skill', '09:00', false),
      task('Read 20 pages', 'Feeds the mind and quiets the noise', '21:30', false),
      task('10,000 steps', 'Movement is the base layer of energy', '', true),
      task('2L water', 'Keeps energy steady from morning to night', '', true),
      task('No screens after 23:00', 'Protects sleep — tomorrow starts tonight', '23:00', true)
    ];
  }

  function seedChallenges() {
    var today = keyOf(new Date());
    return [
      {
        id: uid(),
        title: '7-Day No Sugar',
        why: 'Reset the dopamine baseline and hold steady energy all week.',
        duration: 7,
        startDate: today,
        endDate: shiftKey(today, 6),
        mode: 'habit',
        daily: [
          { id: uid(), title: 'No added sugar' },
          { id: uid(), title: '2L water' },
          { id: uid(), title: '20 minute walk' }
        ],
        plan: [],
        startedAt: null,
        log: {}
      },
      {
        id: uid(),
        title: '14-Day Deep Work',
        why: 'Two weeks of protected focus to prove you can ship without noise.',
        duration: 14,
        startDate: today,
        endDate: shiftKey(today, 13),
        mode: 'habit',
        daily: [
          { id: uid(), title: '90 min deep work' },
          { id: uid(), title: 'Phone in another room' },
          { id: uid(), title: 'Shutdown ritual at 18:00' }
        ],
        plan: [],
        startedAt: null,
        log: {}
      }
    ];
  }

  function seedPrograms() {
    return [
      {
        id: uid(),
        title: 'Morning Protocol',
        why: 'Win the first hour and the rest of the day follows.',
        duration: 21,
        items: ['Wake at 06:00', '10 min sunlight', 'Cold shower', 'Journal 5 min'],
        startedAt: null
      },
      {
        id: uid(),
        title: 'Strength Base',
        why: 'A stronger body raises the ceiling on everything else.',
        duration: 28,
        items: ['Train 45 min', 'Protein 150g', '8,000 steps'],
        startedAt: null
      },
      {
        id: uid(),
        title: 'Focus Reset',
        why: 'Rebuild attention span after a scattered season.',
        duration: 14,
        items: ['90 min deep work', 'No phone first hour', 'Read 20 pages'],
        startedAt: null
      }
    ];
  }

  function seedWorkouts() {
    var now = Date.now();
    function exercise(name) {
      var entry = libraryEntry(name) || { group: 'chest', sets: 3, reps: 10 };
      return {
        id: uid(),
        name: name,
        sets: entry.sets,
        reps: entry.reps,
        group: entry.group,
        unit: entry.unit === 'sec' ? 'sec' : 'reps'
      };
    }
    return [
      {
        id: uid(),
        title: 'Push Day',
        why: 'Drive the chest, shoulders and triceps with clean pressing volume.',
        focus: 'Chest · Shoulders · Triceps',
        days: [1, 4],
        weeks: 4,
        startDate: keyOf(new Date()),
        target: 40,
        exercises: [
          exercise('Push-Up'),
          exercise('Wide Push-Up'),
          exercise('Pike Push-Up'),
          exercise('Diamond Push-Up'),
          exercise('Bench Dip')
        ],
        log: {},
        createdAt: now
      },
      {
        id: uid(),
        title: 'Core & Back',
        why: 'Build the trunk and posture that hold every other session tall.',
        focus: 'Core · Back',
        days: [2, 5],
        weeks: 4,
        startDate: keyOf(new Date()),
        target: 30,
        exercises: [
          exercise('Superman Hold'),
          exercise('Reverse Snow Angel'),
          exercise('Bird Dog'),
          exercise('Plank'),
          exercise('Hollow Hold')
        ],
        log: {},
        createdAt: now
      },
      {
        id: uid(),
        title: 'Leg Day',
        why: 'Strong legs carry every other session and every long day.',
        focus: 'Legs · Glutes',
        days: [3, 6],
        weeks: 4,
        startDate: keyOf(new Date()),
        target: 40,
        exercises: [
          exercise('Squat'),
          exercise('Reverse Lunge'),
          exercise('Glute Bridge'),
          exercise('Calf Raise'),
          exercise('Wall Sit')
        ],
        log: {},
        createdAt: now
      }
    ];
  }

  function seedState() {
    return {
      v: 3,
      view: 'today',
      tasks: seedTasks(),
      days: {},
      restDays: {},
      challenges: seedChallenges(),
      programs: seedPrograms(),
      workouts: seedWorkouts(),
      focus: {
        active: false,
        targets: []
      }
    };
  }

  /* ------------------------------- storage ------------------------------- */

  function normalizeTask(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var title = trimText(raw.title, MAX_TITLE);
    if (!title) return null;
    var recurring = !!raw.recurring;
    /* A one-day task belongs to the date it was created for. Tasks saved by
       older builds carried no date, so they enter today once instead of
       silently rolling forward with every render. */
    var date = validDateKey(raw.date) || keyOf(new Date());
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      title: title,
      why: trimText(raw.why, MAX_WHY),
      time: normalizeTime(raw.time),
      recurring: recurring,
      createdAt: Number(raw.createdAt) || Date.now(),
      date: recurring ? '' : date,
      key: trimText(raw.key, 80) || streakKeyFor(title),
      programId: typeof raw.programId === 'string' ? raw.programId : '',
      programItem: trimText(raw.programItem, MAX_TITLE)
    };
  }

  /* A day keeps its own frozen copy of what was scheduled, so adding, editing
     or deleting a task later can never rewrite a day that already happened. */
  function normalizeDayItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var title = trimText(raw.title, MAX_TITLE);
    if (!title) return null;
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      title: title,
      why: trimText(raw.why, MAX_WHY),
      time: normalizeTime(raw.time),
      recurring: !!raw.recurring,
      key: trimText(raw.key, 80) || streakKeyFor(title),
      programId: typeof raw.programId === 'string' ? raw.programId : '',
      programItem: trimText(raw.programItem, MAX_TITLE),
      programTitle: trimText(raw.programTitle, MAX_TITLE)
    };
  }

  function normalizeDaily(raw) {
    var out = [];
    var seen = {};
    if (!Array.isArray(raw)) return out;
    for (var i = 0; i < raw.length && out.length < MAX_ITEMS; i++) {
      var item = raw[i];
      var title = trimText(typeof item === 'string' ? item : item && item.title, MAX_TITLE);
      if (!title) continue;
      var id = item && typeof item.id === 'string' && item.id ? item.id : uid();
      if (seen[id]) id = uid();
      seen[id] = true;
      out.push({ id: id, title: title });
    }
    return out;
  }

  function normalizeChallenge(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var title = trimText(raw.title, MAX_TITLE);
    if (!title) return null;

    var duration = clampDays(raw.duration);
    var startedAt = validDateKey(raw.startedAt);
    var startDate = validDateKey(raw.startDate) || startedAt || keyOf(new Date());
    var endDate = validDateKey(raw.endDate);

    /* An explicit start-to-end range wins: the length follows the dates. */
    if (endDate && endDate > startDate) {
      duration = clampDays(daysBetween(startDate, endDate) + 1);
    }
    endDate = shiftKey(startDate, duration - 1);

    var daily = normalizeDaily(raw.daily);
    var seen = {};
    daily.forEach(function (item) { seen[item.id] = true; });

    /* Build mode keeps one slot per day. Every slot owns its own items, so a
       day is judged by that day's milestone, not by a shared checklist. */
    var mode = raw.mode === 'build' ? 'build' : 'habit';
    var plan = [];
    if (mode === 'build') {
      var rawPlan = Array.isArray(raw.plan) ? raw.plan : [];
      for (var i = 0; i < duration; i += 1) {
        var slot = rawPlan[i];
        var rawItems = slot && Array.isArray(slot.items)
          ? slot.items
          : (Array.isArray(slot) ? slot : []);
        var items = [];
        for (var j = 0; j < rawItems.length && items.length < MAX_ITEMS; j += 1) {
          var entry = rawItems[j];
          var text = trimText(typeof entry === 'string' ? entry : entry && entry.title, MAX_TITLE);
          if (!text) continue;
          var itemId = entry && typeof entry.id === 'string' && entry.id ? entry.id : uid();
          if (seen[itemId]) itemId = uid();
          seen[itemId] = true;
          items.push({ id: itemId, title: text });
        }
        if (!items.length) {
          var fallbackId = uid();
          seen[fallbackId] = true;
          items.push({ id: fallbackId, title: 'Day ' + (i + 1) + ' milestone' });
        }
        plan.push({ items: items });
      }
    }

    var log = {};
    if (raw.log && typeof raw.log === 'object') {
      Object.keys(raw.log).forEach(function (key) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
        var list = raw.log[key];
        if (!Array.isArray(list)) return;
        var ids = [];
        list.forEach(function (id) {
          if (typeof id === 'string' && seen[id] && ids.indexOf(id) === -1) ids.push(id);
        });
        if (ids.length) log[key] = ids;
      });
    }

    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      title: title,
      why: trimText(raw.why, MAX_WHY),
      mode: mode,
      duration: duration,
      startDate: startDate,
      endDate: endDate,
      daily: daily,
      plan: plan,
      startedAt: startedAt,
      log: log
    };
  }

  function normalizeProgram(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var title = trimText(raw.title, MAX_TITLE);
    if (!title) return null;
    var items = [];
    if (Array.isArray(raw.items)) {
      for (var i = 0; i < raw.items.length && items.length < MAX_ITEMS; i++) {
        var text = trimText(raw.items[i], MAX_TITLE);
        if (text) items.push(text);
      }
    }
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      title: title,
      why: trimText(raw.why, MAX_WHY),
      duration: clampDays(raw.duration),
      items: items,
      startedAt: /^\d{4}-\d{2}-\d{2}$/.test(raw.startedAt) ? raw.startedAt : null
    };
  }

  function normalizeExercise(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var name = trimText(raw.name, MAX_TITLE);
    if (!name) return null;
    var sets = Math.round(Number(raw.sets));
    var reps = Math.round(Number(raw.reps));
    if (!isFinite(sets) || sets < 1) sets = 0;
    if (!isFinite(reps) || reps < 1) reps = 0;
    var entry = libraryEntry(name);
    var group = isGroup(raw.group)
      ? raw.group
      : (entry ? entry.group : groupFromName(name));
    var unit = raw.unit === 'sec' || (!raw.unit && entry && entry.unit === 'sec')
      ? 'sec' : 'reps';
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      name: name,
      sets: Math.min(20, sets),
      reps: Math.min(100, reps),
      group: group,
      unit: unit
    };
  }

  function normalizeWorkout(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var title = trimText(raw.title, MAX_TITLE);
    if (!title) return null;

    var exercises = [];
    var exerciseIds = {};
    if (Array.isArray(raw.exercises)) {
      for (var i = 0; i < raw.exercises.length && exercises.length < MAX_ITEMS; i += 1) {
        var exercise = normalizeExercise(raw.exercises[i]);
        if (!exercise) continue;
        if (exerciseIds[exercise.id]) exercise.id = uid();
        exerciseIds[exercise.id] = true;
        exercises.push(exercise);
      }
    }

    var days = [];
    if (Array.isArray(raw.days)) {
      raw.days.forEach(function (day) {
        var n = parseInt(day, 10);
        if (n >= 0 && n <= 6 && days.indexOf(n) === -1) days.push(n);
      });
    }

    var log = {};
    if (raw.log && typeof raw.log === 'object') {
      Object.keys(raw.log).forEach(function (key) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
        var entry = raw.log[key];
        if (!entry || typeof entry !== 'object') return;
        var done = [];
        if (Array.isArray(entry.done)) {
          entry.done.forEach(function (id) {
            if (typeof id === 'string' && exerciseIds[id] && done.indexOf(id) === -1) done.push(id);
          });
        }
        if (!entry.started && !done.length) return;
        log[key] = {
          started: true,
          done: done,
          finished: !!entry.finished
        };
      });
    }

    var target = Math.round(Number(raw.target));
    if (!isFinite(target) || target < 10) target = 35;
    target = Math.min(120, target);

    /* A program runs for a whole number of weeks from its start date. Older
       templates had no window, so they begin today and stay scheduled. */
    var weeks = Math.round(Number(raw.weeks));
    if (!isFinite(weeks) || weeks < 1) weeks = 4;
    weeks = Math.min(12, weeks);
    var startDate = validDateKey(raw.startDate) || keyOf(new Date());

    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      title: title,
      why: trimText(raw.why, MAX_WHY),
      focus: trimText(raw.focus, 60),
      days: days,
      weeks: weeks,
      startDate: startDate,
      exercises: exercises,
      target: target,
      log: log,
      /* Days before this template existed were never training days, so they
         must never be counted as missed sessions. */
      createdAt: Number(raw.createdAt) || Date.now()
    };
  }

  function loadState() {
    function parse(key) {
      try {
        return JSON.parse(window.localStorage.getItem(key) || 'null');
      } catch (err) {
        return null;
      }
    }

    var raw = parse(STORAGE_KEY);
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.tasks)) {
      for (var i = 0; i < LEGACY_KEYS.length; i += 1) {
        var legacy = parse(LEGACY_KEYS[i]);
        if (legacy && Array.isArray(legacy.tasks)) {
          raw = legacy;
          break;
        }
      }
    }
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.tasks)) return seedState();

    var tasks = [];
    var seen = {};
    raw.tasks.forEach(function (item) {
      var task = normalizeTask(item);
      if (!task) return;
      if (seen[task.id]) task.id = uid();
      seen[task.id] = true;
      tasks.push(task);
    });

    var challenges = [];
    if (Array.isArray(raw.challenges)) {
      raw.challenges.forEach(function (item) {
        var ch = normalizeChallenge(item);
        if (ch) challenges.push(ch);
      });
    } else {
      challenges = seedChallenges();
    }

    var programs = [];
    if (Array.isArray(raw.programs)) {
      raw.programs.forEach(function (item) {
        var pg = normalizeProgram(item);
        if (pg) programs.push(pg);
      });
    } else {
      programs = seedPrograms();
    }

    var workouts = [];
    if (Array.isArray(raw.workouts)) {
      raw.workouts.forEach(function (item) {
        var wk = normalizeWorkout(item);
        if (wk) workouts.push(wk);
      });
    } else {
      workouts = seedWorkouts();
    }

    /* A link to a program that no longer exists would lock an orphaned task,
       so drop the link (the task itself stays) instead of carrying it on. */
    var programIds = {};
    programs.forEach(function (pg) { programIds[pg.id] = true; });
    tasks.forEach(function (task) {
      if (task.programId && !programIds[task.programId]) {
        task.programId = '';
        task.programItem = '';
      }
    });

    var days = {};
    if (raw.days && typeof raw.days === 'object') {
      Object.keys(raw.days).forEach(function (key) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
        var record = raw.days[key];
        if (!record || typeof record !== 'object' || !Array.isArray(record.items)) return;
        var items = [];
        var ids = {};
        record.items.forEach(function (rawItem) {
          var item = normalizeDayItem(rawItem);
          if (!item) return;
          if (ids[item.id]) item.id = uid();
          ids[item.id] = true;
          items.push(item);
        });
        var done = [];
        if (Array.isArray(record.done)) {
          record.done.forEach(function (id) {
            if (typeof id === 'string' && ids[id] && done.indexOf(id) === -1) done.push(id);
          });
        }
        days[key] = { items: items, done: done };
      });
    }

    /* Older builds only stored the completed ids. Rebuild a best-effort
       snapshot for each of those days from the tasks that existed then, so no
       logged tick disappears in the upgrade. */
    if (!Object.keys(days).length && raw.history && typeof raw.history === 'object') {
      function coversThen(task, key) {
        if (!task.programId) return true;
        for (var i = 0; i < programs.length; i += 1) {
          var pg = programs[i];
          if (pg.id !== task.programId) continue;
          if (!pg.startedAt) return false;
          return key >= pg.startedAt && key <= shiftKey(pg.startedAt, pg.duration - 1);
        }
        return false;
      }

      Object.keys(raw.history).forEach(function (key) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
        var logged = raw.history[key];
        if (!Array.isArray(logged) || !logged.length) return;
        var end = fromKey(key).getTime() + 86399999;
        var byId = {};
        var items = [];
        tasks.forEach(function (task) {
          if (task.createdAt > end || !coversThen(task, key)) return;
          var item = {
            id: task.id,
            title: task.title,
            why: task.why,
            time: task.time,
            recurring: !!task.recurring,
            key: taskKey(task),
            programId: task.programId,
            programItem: task.programItem,
            programTitle: ''
          };
          byId[item.id] = true;
          items.push(item);
        });
        var done = logged.filter(function (id) { return typeof id === 'string' && byId[id]; });
        if (items.length) days[key] = { items: items, done: done };
      });
    }

    /* Superfocus stores the ids of the tasks it keeps sharp. A single task
       picked by the old timer build is carried over as one target. */
    var focusRaw = raw.focus && typeof raw.focus === 'object' ? raw.focus : {};
    var focusTargets = [];
    if (Array.isArray(focusRaw.targets)) {
      focusRaw.targets.forEach(function (id) {
        if (typeof id === 'string' && id && focusTargets.indexOf(id) === -1) {
          focusTargets.push(id);
        }
      });
    } else if (typeof focusRaw.taskId === 'string' && focusRaw.taskId) {
      focusTargets.push('task:' + focusRaw.taskId);
    }

    /* Rest days are deliberate recovery dates. They carry no verdict, so
       they are stored separately from the day records. */
    var restDays = {};
    if (raw.restDays && typeof raw.restDays === 'object') {
      Object.keys(raw.restDays).forEach(function (key) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(key) && raw.restDays[key]) restDays[key] = true;
      });
    }

    return {
      v: 3,
      /* Older builds stored a Programs/Workouts tab; both now live on Today. */
      view: raw.view === 'challenges' || raw.view === 'calendar' ? raw.view : 'today',
      tasks: tasks,
      days: days,
      restDays: restDays,
      challenges: challenges,
      programs: programs,
      workouts: workouts,
      focus: {
        active: !!focusRaw.active && focusTargets.length > 0,
        targets: focusTargets
      }
    };
  }

  var saveWarned = false;

  function save() {
    var payload;
    try {
      payload = JSON.stringify(state);
      window.localStorage.setItem(STORAGE_KEY, payload);
      if (window.localStorage.getItem(STORAGE_KEY) !== payload) {
        throw new Error('storage write did not stick');
      }
    } catch (err) {
      /* Private mode or quota: the session still works, but say so once. */
      if (!saveWarned && els.toast) {
        saveWarned = true;
        toast('This device isn’t saving progress');
      }
    }
  }

  /* Re-read the saved day before repainting, so a second tab (or a page
     restored from the back/forward cache) can never show stale checkmarks. */
  function syncFromStorage() {
    var raw = null;
    var stored;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      stored = loadState();
    } catch (err) {
      return;
    }
    var sameDays = JSON.stringify(stored.days) === JSON.stringify(state.days);
    var sameTasks = JSON.stringify(stored.tasks) === JSON.stringify(state.tasks);
    var sameRest = JSON.stringify(stored.restDays) === JSON.stringify(state.restDays);
    var sameFocus = JSON.stringify(stored.focus) === JSON.stringify(state.focus);
    if (sameDays && sameTasks && sameRest && sameFocus) return;
    state.tasks = stored.tasks;
    state.days = stored.days;
    state.restDays = stored.restDays;
    state.focus = stored.focus;
    renderAll();
  }

  /* ------------------------------- progress ------------------------------ */

  function completionsFor(key) {
    var record = state.days[key];
    return record && Array.isArray(record.done) ? record.done : [];
  }

  function isDone(id, key) {
    return completionsFor(key).indexOf(id) !== -1;
  }

  /* A program item belongs to its program, not to the user's everyday
     habits. It only counts while the track covers that day; once the program
     ends it retires from Today and the day's math without being deleted. */
  function programCoversDay(p, key) {
    if (!p || !p.startedAt) return false;
    return key >= p.startedAt && key <= shiftKey(p.startedAt, p.duration - 1);
  }

  function programById(id) {
    for (var i = 0; i < state.programs.length; i++) {
      if (state.programs[i].id === id) return state.programs[i];
    }
    return null;
  }

  function taskActiveOn(task, key) {
    if (task.programId) return programCoversDay(programById(task.programId), key);
    /* Only non-negotiables recur. A regular task lives on its own date. */
    if (task.recurring) return true;
    return task.date === key;
  }

  /* Freeze a task into a day's own record, naming its program now so a past
     day still reads correctly after that program is deleted. */
  function frozenTask(task) {
    var p = task.programId ? programById(task.programId) : null;
    return {
      id: task.id,
      title: task.title,
      why: task.why,
      time: task.time,
      recurring: !!task.recurring,
      key: taskKey(task),
      programId: task.programId || '',
      programItem: task.programItem || '',
      programTitle: p ? p.title : (task.programTitle || '')
    };
  }

  /* Today is the only day that follows live edits: its snapshot is rebuilt
     from the task list on every render, while every past day stays sealed. */
  function syncTodaySnapshot() {
    var record = state.days[todayKey];
    if (!record) record = state.days[todayKey] = { items: [], done: [] };

    var ids = {};
    var items = [];
    state.tasks.forEach(function (task) {
      if (!taskActiveOn(task, todayKey)) return;
      ids[task.id] = true;
      items.push(frozenTask(task));
    });

    if (JSON.stringify(record.items) !== JSON.stringify(items)) record.items = items;
    /* A program that just ended leaves its items behind, not their ticks. */
    record.done = (Array.isArray(record.done) ? record.done : []).filter(function (id) {
      return ids[id];
    });
    return record;
  }

  function dayItems(key) {
    if (key === todayKey) return syncTodaySnapshot().items;
    var record = state.days[key];
    return record && Array.isArray(record.items) ? record.items : [];
  }

  function activeTasksOn(key) {
    return dayItems(key);
  }

  /* Legacy program items still belong to their day record, but Today no longer
     renders a Program Routine block, so they stay out of the live score. */
  function scoreTasksOn(key) {
    return activeTasksOn(key).filter(function (task) { return !task.programId; });
  }

  function doneCount(key) {
    var ids = completionsFor(key);
    var n = 0;
    scoreTasksOn(key).forEach(function (task) {
      if (ids.indexOf(task.id) !== -1) n += 1;
    });
    return n;
  }

  function allDone(key) {
    var tasks = scoreTasksOn(key);
    if (!tasks.length) return false;
    return doneCount(key) === tasks.length;
  }

  /* A tick counts for a habit when either its record id or its stable key
     matches, so a task that was removed and re-added under the same name
     keeps the run it had. */
  function taskDoneOn(task, key) {
    if (isDone(task.id, key)) return true;
    var stable = taskKey(task);
    if (!stable) return false;
    var record = state.days[key];
    if (!record) return false;
    var done = Array.isArray(record.done) ? record.done : [];
    return (record.items || []).some(function (item) {
      return done.indexOf(item.id) !== -1 && taskKey(item) === stable;
    });
  }

  function streakFor(task, key) {
    var cursor = key;
    var n = 0;
    var guard = 0;
    while (guard < MAX_STREAK) {
      guard += 1;
      /* Rest days freeze the run without adding to it. */
      if (isRestDay(cursor)) {
        cursor = shiftKey(cursor, -1);
        continue;
      }
      if (taskDoneOn(task, cursor)) {
        n += 1;
        cursor = shiftKey(cursor, -1);
        continue;
      }
      /* An unfinished today can still be saved by yesterday's run. */
      if (cursor === key) {
        cursor = shiftKey(cursor, -1);
        continue;
      }
      break;
    }
    return n;
  }

  /* The badge starts on the second consecutive day: the first tick is just
     showing up, the run is only real once it repeats. */
  function streakBadge(streak) {
    return streak >= 2 ? streak - 1 : 0;
  }

  function perfectStreak() {
    /* A rest day is skipped rather than counted, so it freezes the run
       without padding it. An unfinished today can still be saved. */
    if (!isRestDay(todayKey) && !activeTasksOn(todayKey).length) return 0;
    var cursor = todayKey;
    var n = 0;
    var guard = 0;
    while (guard < MAX_STREAK) {
      guard += 1;
      if (isRestDay(cursor)) {
        cursor = shiftKey(cursor, -1);
        continue;
      }
      if (!allDone(cursor)) {
        if (cursor === todayKey) {
          cursor = shiftKey(cursor, -1);
          continue;
        }
        break;
      }
      n += 1;
      cursor = shiftKey(cursor, -1);
    }
    return n;
  }

  // Smallest completed count whose rounded percentage clears the win bar.
  function winTarget(total) {
    if (!total) return 0;
    for (var k = 1; k <= total; k++) {
      if (Math.round((k / total) * 100) >= WON_AT) return k;
    }
    return total;
  }

  function toggleTask(id, dayKey) {
    var key = dayKey || selectedKey;
    /* Rest is enforced here, not just by hiding the list: a concealed row or
       a stale handler still cannot tick a rest day. */
    if (isRestDay(key)) {
      toast('Rest day · check-offs are paused');
      return;
    }
    var record = state.days[key];
    if (!record && key === todayKey) record = syncTodaySnapshot();
    if (!record) return;

    /* Only a task that belongs to this day can be ticked on it. */
    var onDay = record.items.some(function (item) { return item.id === id; });
    if (!onDay) return;

    var list = record.done.slice();
    var index = list.indexOf(id);
    var adding = index === -1;

    if (adding) list.push(id);
    else list.splice(index, 1);

    record.done = list;
    save();
    renderAll(adding ? id : null);

    /* Silent on purpose: completing a task makes no sound. */
    if (adding) vibrate(8);
  }

  function vibrate(ms) {
    if (!navigator.vibrate) return;
    try { navigator.vibrate(ms); } catch (err) { /* ignore */ }
  }

  /* -------------------------------- render ------------------------------- */

  function renderWeek() {
    els.weekStrip.textContent = '';

    var today = fromKey(todayKey);
    var weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    for (var i = 0; i < 7; i++) {
      var d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      var key = keyOf(d);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'wk';
      btn.dataset.key = key;

      if (key === todayKey) btn.classList.add('is-today');
      if (key === selectedKey) btn.classList.add('is-selected');
      if (key > todayKey) btn.disabled = true;

      var day = makeEl('span', 'wk-day',
        d.toLocaleDateString(undefined, { weekday: 'short' }).replace(/\.$/, ''));
      var date = makeEl('span', 'wk-date', String(d.getDate()));
      var result = dayResult(key);
      var dot = makeEl('span', 'wk-dot');
      dot.setAttribute('aria-hidden', 'true');

      /* An open day carries a live dot; a closed day carries its final mark.
         Rest days get their own neutral moon, never a red cross. Empty days
         stay neutral — never a red mark for having nothing planned. */
      if (result.rest) {
        dot.classList.add('is-rest');
        dot.textContent = '☾';
      } else if (result.total) {
        if (key < todayKey) {
          if (result.won) {
            dot.classList.add('is-check');
            dot.textContent = '✓';
          } else {
            dot.classList.add('is-cross');
            dot.textContent = '✕';
          }
        } else if (key === todayKey) {
          dot.classList.add(result.won ? 'is-win' : 'is-loss');
        }
      }

      var label = d.toLocaleDateString(undefined, {
        weekday: 'long', month: 'short', day: 'numeric'
      });
      if (result.rest) {
        label += ' — rest day, streak frozen';
      } else if (key < todayKey && result.total) {
        label += ' — closed, ' + (result.won ? 'win' : 'loss') +
          ', ' + result.done + ' of ' + result.total;
      } else if (key === todayKey && result.total) {
        label += ' — ' + (result.won ? 'on track' : 'below threshold') +
          ', ' + result.done + ' of ' + result.total;
      } else if (key <= todayKey) {
        label += ' — nothing scheduled';
      }
      btn.setAttribute('aria-label', label);
      btn.setAttribute('aria-pressed', key === selectedKey ? 'true' : 'false');
      btn.title = label;

      btn.appendChild(day);
      btn.appendChild(date);
      btn.appendChild(dot);

      btn.addEventListener('click', function (event) {
        var target = event.currentTarget;
        if (target.disabled || superfocusOn()) return;
        selectedKey = target.dataset.key;
        renderAll();
      });

      els.weekStrip.appendChild(btn);
    }
  }

  /* Workouts keep their own scheduled window; the studio uses it to preload
     today's session. They are no longer part of the Today score. */
  function workoutScheduledOn(w, key) {
    if (w.days.indexOf(fromKey(key).getDay()) === -1) return false;
    if (!w.startDate) return true;
    return key >= w.startDate && key <= shiftKey(w.startDate, w.weeks * 7 - 1);
  }

  /* Challenges run by their own dates, and every daily action is part of the
     same day score while the window is open. */
  function challengeActiveOn(ch, key) {
    if (!ch || !ch.startDate || !ch.endDate) return false;
    return key >= ch.startDate && key <= ch.endDate;
  }

  function challengesOn(key) {
    return state.challenges.filter(function (ch) { return challengeActiveOn(ch, key); });
  }

  /* A rest day is intentional recovery: no WIN, no LOSS, and it never breaks
     a streak or enters a win rate. */
  function isRestDay(key) {
    return !!(state.restDays && state.restDays[key]);
  }

  function challengeMode(ch) {
    return ch && ch.mode === 'build' ? 'build' : 'habit';
  }

  /* Habit mode repeats one checklist every day. Build mode gives every date
     its own slot, so only that day's milestone counts. */
  function challengeItemsFor(ch, key) {
    if (!ch || !challengeActiveOn(ch, key)) return [];
    if (challengeMode(ch) === 'habit') return ch.daily || [];
    var index = ch.startDate ? daysBetween(ch.startDate, key) : -1;
    if (index < 0 || index >= ch.duration) return [];
    var slot = ch.plan && ch.plan[index];
    return slot && Array.isArray(slot.items) ? slot.items : [];
  }

  function challengeDayComplete(ch, key) {
    var items = challengeItemsFor(ch, key);
    if (!items.length) return false;
    var log = (ch.log && ch.log[key]) || [];
    for (var i = 0; i < items.length; i += 1) {
      if (log.indexOf(items[i].id) === -1) return false;
    }
    return true;
  }

  function challengeRestCount(ch) {
    var n = 0;
    for (var i = 0; i < ch.duration; i += 1) {
      if (isRestDay(shiftKey(ch.startDate, i))) n += 1;
    }
    return n;
  }

  function challengeActiveDays(ch) {
    return Math.max(1, ch.duration - challengeRestCount(ch));
  }

  function challengeDayStats(key) {
    var total = 0;
    var done = 0;
    challengesOn(key).forEach(function (ch) {
      var log = (ch.log && ch.log[key]) || [];
      challengeItemsFor(ch, key).forEach(function (item) {
        total += 1;
        if (log.indexOf(item.id) !== -1) done += 1;
      });
    });
    return { total: total, done: done };
  }

  /* One verdict for a day, shared by the scale, the week strip and the monthly
     calendar, so all three always agree on WIN vs LOSS. */
  function dayResult(key) {
    var taskTotal = scoreTasksOn(key).length;
    var taskDone = doneCount(key);
    var challenge = challengeDayStats(key);
    var total = taskTotal + challenge.total;
    var done = taskDone + challenge.done;
    var pct = total ? Math.round((done / total) * 100) : 0;
    var rest = isRestDay(key);
    return {
      total: total,
      done: done,
      pct: pct,
      tasks: { total: taskTotal, done: taskDone },
      challenge: challenge,
      rest: rest,
      /* No items at all is not a failure: the day simply carries no score. */
      empty: total === 0,
      /* A rest day is never a win, even when every box was ticked. */
      won: !rest && total > 0 && pct >= WON_AT,
      perfect: !rest && total > 0 && done === total
    };
  }

  function renderProgress() {
    var result = dayResult(selectedKey);
    var total = result.total;
    var done = result.done;
    var pct = result.pct;
    var empty = result.empty;
    var rest = result.rest;
    var color = rest ? '#b9a7f5'
      : empty ? '#8d879b'
        : pct >= WON_AT ? '#34d399' : pct >= 34 ? '#fbbf24' : '#ff6b6b';
    var glow = rest ? 'rgba(139, 92, 246, 0.22)'
      : empty ? 'rgba(141, 135, 155, 0.14)'
        : pct >= WON_AT
          ? 'rgba(34, 197, 94, 0.24)'
          : pct >= 34 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)';

    els.progressDone.textContent = String(done);
    els.progressTotal.textContent = String(total);
    els.progressPctNum.textContent = String(pct);
    els.progressPct.style.color = color;
    els.progressDate.textContent =
      (selectedKey === todayKey ? 'Today · ' : '') +
      fromKey(selectedKey).toLocaleDateString(undefined, {
        weekday: 'long', month: 'short', day: 'numeric'
      });

    els.scale.style.setProperty('--p', pct + '%');
    els.scaleMarker.style.color = color;
    els.scale.setAttribute('aria-valuenow', String(pct));
    els.scale.setAttribute('aria-valuetext', done + ' of ' + total + ' completed');
    els.progressGlow.style.background =
      'radial-gradient(circle, ' + glow + ' 0%, transparent 68%)';

    var won = result.won;

    if (rest) {
      els.scaleStatus.textContent = 'Rest day · streak frozen';
      els.scaleStatus.classList.remove('is-win');
    } else if (empty) {
      els.scaleStatus.textContent = 'Nothing scheduled · neutral day';
      els.scaleStatus.classList.remove('is-win');
    } else if (won) {
      els.scaleStatus.textContent = 'Win zone · threshold cleared';
      els.scaleStatus.classList.add('is-win');
    } else {
      var need = Math.max(0, winTarget(total) - done);
      els.scaleStatus.textContent = need + ' to win · ' + WON_AT + '% threshold';
      els.scaleStatus.classList.remove('is-win');
    }

    /* An empty day is neither won nor lost, and a rest day is deliberately
       neither, so neither ever wears the LOSS badge. */
    els.progressVerdict.textContent = rest ? 'REST' : empty ? 'CLEAR' : won ? 'WIN' : 'LOSS';
    els.progressVerdict.dataset.state = rest ? 'rest' : empty ? 'clear' : won ? 'win' : 'loss';
    els.progressVerdict.setAttribute(
      'aria-label',
      rest
        ? 'Day status: rest day, no win or loss'
        : empty
          ? 'Day status: nothing scheduled'
          : 'Day status: ' + (won ? 'WIN' : 'LOSS') + ' — ' + done + ' of ' + total +
              ' tasks done, ' + WON_AT + '% needed to win'
    );

    if (els.restToggle) {
      /* Recovery is a starting choice, never a retreat: once a single action
         is ticked the day is in play and Rest Day stays locked. */
      var restLocked = !rest && done > 0;
      els.restToggle.classList.toggle('is-on', rest);
      els.restToggle.classList.toggle('is-locked', restLocked);
      els.restToggle.setAttribute('aria-pressed', rest ? 'true' : 'false');
      els.restToggle.setAttribute('aria-disabled', restLocked ? 'true' : 'false');
      els.restToggle.title = restLocked
        ? 'Rest Day is locked once progress starts'
        : rest ? 'Turn this rest day off' : 'Mark this day as recovery';
      if (els.restToggleText) {
        els.restToggleText.textContent = rest
          ? 'Rest day on'
          : restLocked ? 'Rest day locked' : 'Rest day';
      }
      if (els.restToggleIcon) els.restToggleIcon.textContent = restLocked ? '🔒' : '☾';
    }

    if (rest) {
      els.topMeta.textContent = 'Rest day. Recovery is part of the plan.';
    } else if (selectedKey !== todayKey) {
      els.topMeta.textContent = total
        ? 'Reviewing an earlier day.'
        : 'Nothing was scheduled on this day.';
    } else if (empty) {
      els.topMeta.textContent = 'Nothing scheduled. Add a task when you are ready.';
    } else if (done === total) {
      els.topMeta.textContent = 'Perfect day. Every box closed.';
    } else {
      els.topMeta.textContent = 'Today’s standard, executed.';
    }

    var streak = perfectStreak();
    els.perfectCount.textContent = String(streak);
    els.perfectPill.classList.toggle('is-hot', streak > 0);
  }

  function programOf(task) {
    return task.programId ? programById(task.programId) : null;
  }

  function buildCard(task, flash) {
    var done = isDone(task.id, selectedKey);
    var program = programOf(task);
    /* A frozen past day can name a program that has since been deleted. */
    var programTitle = program ? program.title : (task.programTitle || '');
    var isProgram = !!task.programId;
    /* The day on screen owns its cards: a task added on, or carried into, a
       past day can be edited and deleted right there. Only program items stay
       owned by their track. */
    var editable = !isProgram;

    var li = document.createElement('li');
    li.className = 'task-card';
    li.dataset.id = task.id;
    var focusId = 'task:' + task.id;
    li.dataset.focusId = focusId;
    if (superfocusOn()) {
      li.classList.add(isFocusTarget(focusId) ? 'is-focus-target' : 'is-focus-dim');
    }
    if (done) li.classList.add('is-done');
    if (isProgram) li.classList.add('is-program');
    if (flash && flash === task.id) li.classList.add('just-done');

    var check = document.createElement('button');
    check.type = 'button';
    check.className = 'check';
    check.setAttribute('role', 'checkbox');
    check.setAttribute('aria-checked', done ? 'true' : 'false');
    check.setAttribute('aria-label', (done ? 'Mark not done: ' : 'Complete: ') + task.title);
    check.innerHTML = CHECK_SVG;
    check.addEventListener('click', function () {
      toggleTask(task.id);
    });

    /* A program task keeps its structure: it is checked off here but never
       opened as a standalone ad-hoc task. */
    var body;
    if (!editable) {
      body = document.createElement('div');
      body.className = 'task-body is-locked';
    } else {
      body = document.createElement('button');
      body.type = 'button';
      body.className = 'task-body';
      body.setAttribute('aria-label', superfocusOn()
        ? (isFocusTarget(focusId) ? 'Release from Superfocus: ' : 'Keep in Superfocus: ') + task.title
        : 'Edit ' + task.title);
      body.addEventListener('click', function () {
        /* In Superfocus a tap chooses what stays sharp; editing comes back
           the moment focus is turned off. */
        if (superfocusOn()) {
          toggleFocusTarget(focusId);
          return;
        }
        openTaskSheet(task);
      });
    }

    var top = document.createElement('span');
    top.className = 'task-top';

    if (task.time) {
      top.appendChild(makeEl('span', 'task-time', task.time));
    }

    if (isProgram && programTitle) {
      var tag = makeEl('span', 'task-prog', '◆ ' + programTitle);
      tag.dir = 'auto';
      tag.setAttribute('title', 'Part of the ' + programTitle + ' program');
      top.appendChild(tag);
    }

    var title = makeEl('span', 'task-title', task.title);
    title.dir = 'auto';
    top.appendChild(title);
    body.appendChild(top);

    /* A program task repeats the track's purpose on every card; the program
       card already says it once, so keep the routine rows quiet. */
    var repeatWhy = program && task.why === program.why;
    if (task.why && !repeatWhy) {
      var why = makeEl('span', 'task-why', task.why);
      why.dir = 'auto';
      body.appendChild(why);
    }

    var side = document.createElement('div');
    side.className = 'task-side';

    var streak = streakBadge(streakFor(task, selectedKey));
    if (streak > 0) {
      var badge = makeEl('span', 'streak' + (streak >= 3 ? ' is-hot' : ''), '🔥 ' + streak);
      badge.setAttribute('title', (streak + 1) + ' consecutive days');
      side.appendChild(badge);
    }

    /* Deleting a linked task alone would leave the program short an item;
       it leaves with the program instead. */
    if (!isProgram && editable) {
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'task-del';
      del.setAttribute('aria-label', 'Delete ' + task.title);
      del.innerHTML = X_SVG;
      del.addEventListener('click', function (event) {
        event.stopPropagation();
        /* Delete from the day on screen, not silently from today. */
        var cardKey = selectedKey;
        askDelete(task.recurring ? 'habit' : 'task', task.title, function () {
          removeTask(task.id, cardKey);
        });
      });
      side.appendChild(del);
    }

    li.appendChild(check);
    li.appendChild(body);
    li.appendChild(side);
    return li;
  }


  /* Rest is a strict state on Today: the day's lists are concealed behind a
     quiet moon panel, so there is no list — and no check-off — to work with. */
  function pausedItemCount(key) {
    var n = scoreTasksOn(key).length;
    challengesOn(key).forEach(function (ch) {
      n += challengeItemsFor(ch, key).length;
    });
    return n;
  }

  function renderRestState() {
    var rest = isRestDay(selectedKey);
    document.body.classList.toggle('rest-day', rest);
    if (!els.restState) return;
    els.restState.hidden = !rest;
    if (!rest) return;

    var paused = pausedItemCount(selectedKey);
    if (els.restStateCount) {
      els.restStateCount.textContent = paused
        ? paused + ' item' + (paused === 1 ? '' : 's') +
          ' paused · nothing to win or lose'
        : 'Nothing scheduled · nothing to win or lose';
    }
  }

  function renderTodayChallenges() {
    /* Follow the selected date, not only today: stepping back onto a date a
       challenge has already closed over keeps that day's actions, ticks and
       the challenge's verdict on screen instead of going blank. */
    var dayKey = selectedKey;
    var past = dayKey < todayKey;

    var list = challengesOn(dayKey);
    els.challengeTodayList.textContent = '';
    if (!list.length) {
      els.challengeTodaySection.hidden = true;
      return;
    }
    els.challengeTodaySection.hidden = false;

    var rest = isRestDay(dayKey);
    var total = 0;
    var doneTotal = 0;
    list.forEach(function (ch) {
      var log = ch.log[dayKey] || [];
      var items = challengeItemsFor(ch, dayKey);
      total += items.length;
      doneTotal += items.filter(function (item) {
        return log.indexOf(item.id) !== -1;
      }).length;
    });
    els.challengeTodayCount.textContent = doneTotal + ' of ' + total +
      ' actions · ' + list.length + (past ? ' on this day' : ' running') +
      (rest ? ' · rest day' : '');

    list.forEach(function (ch) {
      var st = challengeStatus(ch);
      var log = ch.log[dayKey] || [];
      var items = challengeItemsFor(ch, dayKey);
      var done = items.filter(function (item) {
        return log.indexOf(item.id) !== -1;
      }).length;
      /* A rest day is never a fake win, even with every box ticked. */
      var complete = !rest && done === items.length && items.length > 0;
      var build = challengeMode(ch) === 'build';
      var dayNo = daysBetween(ch.startDate, dayKey) + 1;
      var focusTargets = focusTargetsToday();
      var cardFocus = items.some(function (item) {
        return focusTargets.indexOf('challenge:' + ch.id + ':' + item.id) !== -1;
      });

      /* The whole header follows the title's direction, so a Hebrew title
         starts at the right edge and the win chip moves to the left. */
      var dir = textDir(ch.title);
      var card = makeEl('article', 'today-challenge-card' +
        (complete ? ' is-done' : '') + (rest ? ' is-rest' : '') +
        (past ? ' is-past' : ''));
      card.dir = dir;
      if (superfocusOn()) {
        card.classList.add(cardFocus ? 'is-focus-target' : 'is-focus-dim');
      }
      var head = makeEl('div', 'today-challenge-head');
      head.dir = dir;
      var wrap = makeEl('div', 'today-challenge-copy');
      var title = makeEl('h3', 'today-challenge-name', ch.title);
      title.dir = 'auto';
      wrap.appendChild(title);

      /* A closed window states its verdict here too, so the date still reads
         as part of the challenge the Challenges tab judged. */
      var verdictNote = st.verdict
        ? ' · challenge ' + (st.verdict === 'win' ? 'won' : 'lost')
        : '';
      var metaText = rest
        ? 'Rest day · streak frozen'
        : 'Day ' + dayNo + ' of ' + ch.duration + (build ? ' milestone' : '') +
          ' · ' + done + ' of ' + items.length + (past ? ' done' : ' today') +
          verdictNote;
      var meta = makeEl('p', 'today-challenge-meta', metaText);
      meta.dir = dir;
      wrap.appendChild(meta);
      head.appendChild(wrap);
      var chip = makeEl('span', 'today-challenge-chip',
        rest ? 'REST DAY'
          : !items.length ? 'NO ACTIONS'
            : complete ? '✓ DAY WON'
              : past ? 'DAY LOST' : st.won + ' WINS');
      /* Keep “0 WINS” in reading order inside a right-to-left header. */
      chip.dir = 'ltr';
      head.appendChild(chip);
      card.appendChild(head);

      var listEl = makeEl('ul', 'mini-list today-challenge-items');
      items.forEach(function (item) {
        var ticked = log.indexOf(item.id) !== -1;
        var li = makeEl('li', 'mini-item' + (ticked ? ' is-done' : ''));
        var focusId = 'challenge:' + ch.id + ':' + item.id;
        li.dataset.focusId = focusId;
        if (superfocusOn()) {
          li.classList.add(focusTargets.indexOf(focusId) !== -1
            ? 'is-focus-target' : 'is-focus-dim');
        }
        /* Every row in the card follows the challenge direction, so the
           check controls stay on one side even with mixed-language items. */
        li.dir = dir;
        var text = makeEl('span', 'mini-text', item.title);
        text.dir = 'auto';

        /* A past date is sealed: its ticks are shown, never edited, so the
           verdict the Challenges tab already declared cannot be rewritten. */
        if (past) {
          li.classList.add('is-static');
          li.appendChild(text);
          listEl.appendChild(li);
          return;
        }

        var btn = makeEl('button', 'mini-check');
        btn.type = 'button';
        btn.setAttribute('role', 'checkbox');
        btn.setAttribute('aria-checked', ticked ? 'true' : 'false');
        btn.setAttribute('aria-label', (ticked ? 'Undo: ' : 'Complete: ') + item.title);
        btn.innerHTML = CHECK_SVG;
        btn.addEventListener('click', function (event) {
          event.stopPropagation();
          toggleChallengeItem(ch, item.id, dayKey);
        });
        /* While Superfocus is on, the row itself is the focus switch. */
        li.addEventListener('click', function () {
          if (superfocusOn()) toggleFocusTarget(focusId);
        });
        li.appendChild(btn);
        li.appendChild(text);
        listEl.appendChild(li);
      });
      card.appendChild(listEl);
      els.challengeTodayList.appendChild(card);
    });
  }

  function fillList(listEl, items, emptyEl, flash) {
    listEl.textContent = '';
    items.forEach(function (task) {
      listEl.appendChild(buildCard(task, flash));
    });
    emptyEl.hidden = items.length > 0;
  }

  function renderLists(flash) {
    /* Read the selected day's own snapshot: a past day shows what it held,
       not whatever the list happens to contain today. Program items are not
       personal habits, so they never enter Ideal Day or Non-Negotiables. */
    var items = dayItems(selectedKey);
    var plan = items.filter(function (t) { return !t.recurring && !t.programId; });
    var habits = items.filter(function (t) { return t.recurring && !t.programId; });

    fillList(els.planList, plan, els.planEmpty, flash);
    fillList(els.nnList, habits, els.nnEmpty, flash);

    function countLabel(items, noun) {
      var done = items.filter(function (t) { return isDone(t.id, selectedKey); }).length;
      return items.length + ' ' + noun + (items.length === 1 ? '' : 's') +
        (items.length ? ' · ' + done + ' done' : '');
    }

    els.planCount.textContent = countLabel(plan, 'task');
    els.nnCount.textContent = countLabel(habits, 'habit');
  }
  /* ------------------------------ challenges ----------------------------- */

  function challengeWonDays(ch) {
    if (!ch.startDate) return 0;
    var n = 0;
    for (var i = 0; i < ch.duration; i += 1) {
      var key = shiftKey(ch.startDate, i);
      if (key > todayKey) break;
      /* Rest days are skipped: they neither add a win nor break the run. */
      if (isRestDay(key)) continue;
      if (challengeDayComplete(ch, key)) n += 1;
    }
    return n;
  }

  /* The same 67% standard the day scale uses, scaled to the challenge's
     active days: rest days are removed from both sides of the ratio. */
  function challengeThreshold(ch) {
    return Math.max(1, Math.ceil(challengeActiveDays(ch) * WON_AT / 100));
  }

  /* A challenge runs by its dates alone — no start button to forget. */
  function challengeStatus(ch) {
    var won = challengeWonDays(ch);
    var activeDays = challengeActiveDays(ch);
    var threshold = challengeThreshold(ch);
    var pct = Math.round((won / activeDays) * 100);

    if (todayKey < ch.startDate) {
      return {
        kind: 'scheduled', label: 'Starts ' + shortDate(ch.startDate),
        day: 0, won: 0, pct: 0, threshold: threshold, activeDays: activeDays
      };
    }
    if (todayKey > ch.endDate) {
      var verdict = won >= threshold ? 'win' : 'loss';
      return {
        kind: 'over', label: verdict === 'win' ? 'Win' : 'Loss', day: ch.duration,
        won: won, pct: pct, threshold: threshold, verdict: verdict, activeDays: activeDays
      };
    }
    if (won >= activeDays) {
      return {
        kind: 'won', label: 'Win', day: ch.duration, won: won, pct: 100,
        threshold: threshold, verdict: 'win', activeDays: activeDays
      };
    }
    var raw = daysBetween(ch.startDate, todayKey) + 1;
    return {
      kind: 'live', label: 'Day ' + raw + ' / ' + ch.duration, day: raw, won: won,
      pct: pct, threshold: threshold, activeDays: activeDays
    };
  }

  function buildChallengeVerdict(ch, st) {
    if (!st.verdict) return null;
    var win = st.verdict === 'win';
    /* One verdict per card: the header status pill carries WIN / LOSS, so
       this block only explains the numbers behind it. */
    var box = makeEl('div', 'challenge-verdict is-' + st.verdict);
    var copy = makeEl('div', 'verdict-copy');
    copy.appendChild(makeEl('b', 'verdict-title',
      st.won + ' of ' + st.activeDays + ' active days won'));
    copy.appendChild(makeEl('span', 'verdict-note', win
      ? (st.won >= st.activeDays
        ? 'Every active day cleared — target ' + st.threshold + ' met.'
        : 'Target ' + st.threshold + ' days met. Window closed strong.')
      : 'Target ' + st.threshold + ' days · ' + (st.threshold - st.won) + ' short.'));
    box.appendChild(copy);
    return box;
  }

  function deleteButton(label, handler) {
    var btn = makeEl('button', 'track-del');
    btn.type = 'button';
    btn.setAttribute('aria-label', label);
    btn.innerHTML = X_SVG;
    btn.addEventListener('click', handler);
    return btn;
  }

  function editButton(label, handler) {
    var btn = makeEl('button', 'track-edit');
    btn.type = 'button';
    btn.setAttribute('aria-label', label);
    btn.innerHTML = EDIT_SVG;
    btn.addEventListener('click', handler);
    return btn;
  }

  function removeChallenge(ch) {
    state.challenges = state.challenges.filter(function (item) { return item.id !== ch.id; });
    save();
    renderAll();
    toast('✓ Challenge deleted');
  }

  function dateChip(label, key) {
    var chip = makeEl('span', 'track-date');
    chip.appendChild(makeEl('span', 'track-date-k', label));
    chip.appendChild(makeEl('b', null, shortDate(key)));
    return chip;
  }

  function renderChallenges() {
    els.challengeList.textContent = '';
    els.challengeList.classList.toggle('is-managing', manageChallenges);

    state.challenges.forEach(function (ch, index) {
      var st = challengeStatus(ch);
      var todayRest = isRestDay(todayKey);
      var build = challengeMode(ch) === 'build';
      var todayItems = challengeItemsFor(ch, todayKey);
      var todayIndex = daysBetween(ch.startDate, todayKey);
      var accent = ACCENTS[index % ACCENTS.length];
      var card = makeEl('article', 'track-card' +
        (st.verdict === 'win' ? ' is-won' : '') +
        (st.verdict === 'loss' ? ' is-loss' : '') +
        (st.kind === 'scheduled' ? ' is-scheduled' : '') +
        (todayRest && st.kind === 'live' ? ' is-rest' : ''));
      card.style.setProperty('--track-a', accent[0]);
      card.style.setProperty('--track-b', accent[1]);

      var top = makeEl('div', 'track-top');
      top.dir = textDir(ch.title);
      var wrap = makeEl('div', 'track-title-wrap');
      wrap.dir = 'auto';
      var heading = makeEl('h3', 'track-title', ch.title);
      heading.dir = 'auto';
      wrap.appendChild(heading);
      if (ch.why) {
        var why = makeEl('p', 'track-why', ch.why);
        why.dir = 'auto';
        wrap.appendChild(why);
      }
      top.appendChild(wrap);
      var statusKind = todayRest && st.kind === 'live'
        ? 'rest'
        : st.verdict === 'win' ? 'win' : st.verdict === 'loss' ? 'loss' : st.kind;
      var statusLabel = todayRest && st.kind === 'live'
        ? 'Rest day'
        : st.verdict === 'win' ? 'WIN'
          : st.verdict === 'loss' ? 'LOSS' : st.label;
      var statusEl = makeEl('span', 'track-status is-' + statusKind, statusLabel);
      statusEl.dir = 'auto';
      top.appendChild(statusEl);
      card.appendChild(top);

      /* Every challenge states its own beginning and finish. */
      var dates = makeEl('div', 'track-dates');
      dates.dir = 'ltr';
      dates.appendChild(dateChip('Start', ch.startDate));
      dates.appendChild(dateChip('End', ch.endDate));
      dates.appendChild(makeEl('span', 'track-dates-len', ch.duration + ' days'));
      card.appendChild(dates);

      var verdict = buildChallengeVerdict(ch, st);
      if (verdict) card.appendChild(verdict);

      var meter = makeEl('div', 'track-meter');
      var fill = makeEl('span');
      fill.style.width = st.pct + '%';
      meter.appendChild(fill);
      card.appendChild(meter);

      var meta = makeEl('div', 'track-meta');
      meta.dir = 'ltr';
      meta.appendChild(makeEl('span', null,
        st.kind === 'scheduled'
          ? 'Starts ' + shortDate(ch.startDate) + ' · ' +
            (build ? ch.duration + ' day slots' : ch.daily.length + ' daily actions')
          : 'Day ' + st.day + ' / ' + ch.duration));
      var wins = makeEl('span');
      var winsNum = makeEl('b', null, String(st.won));
      wins.appendChild(winsNum);
      wins.appendChild(document.createTextNode(
        ' wins' + (st.verdict ? '' : ' · need ' + st.threshold)));
      meta.appendChild(wins);
      card.appendChild(meta);

      if (ch.startDate) {
        var daysRow = makeEl('div', 'track-days');
        daysRow.setAttribute('aria-hidden', 'true');
        for (var i = 0; i < ch.duration; i++) {
          var mark = makeEl('span', 'day-mark');
          var key = shiftKey(ch.startDate, i);
          if (key <= todayKey && isRestDay(key)) {
            mark.classList.add('is-rest');
            daysRow.appendChild(mark);
            continue;
          }
          var complete = key <= todayKey && challengeDayComplete(ch, key);
          if (complete) mark.classList.add('is-won');
          else if (i === todayIndex) mark.classList.add('is-today');
          else if (key < todayKey) mark.classList.add('is-missed');
          daysRow.appendChild(mark);
        }
        card.appendChild(daysRow);
      }

      /* A build track can unfold every day's milestones right on the card,
         and fold them away again on the same tap. */
      if (build && ch.plan) {
        var planOpen = !!openBuildCards[ch.id];
        var planToggle = makeEl('button', 'track-expand' + (planOpen ? ' is-open' : ''));
        planToggle.type = 'button';
        planToggle.setAttribute('aria-expanded', planOpen ? 'true' : 'false');
        planToggle.setAttribute('aria-controls', 'trackPlan-' + ch.id);
        var planToggleText = makeEl('span', 'track-expand-text',
          planOpen ? 'Hide the day plan' : 'Show all ' + ch.duration + ' days');
        planToggle.appendChild(planToggleText);
        var planChev = makeEl('span', 'track-expand-chev');
        planChev.setAttribute('aria-hidden', 'true');
        planChev.innerHTML =
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
          'stroke-linecap="round" stroke-linejoin="round"><path d="m6 9.5 6 6 6-6"/></svg>';
        planToggle.appendChild(planChev);

        var planWrap = makeEl('div', 'track-plan' + (planOpen ? ' is-open' : ''));
        planWrap.id = 'trackPlan-' + ch.id;
        var planInner = makeEl('div', 'track-plan-inner');
        var planList = makeEl('ol', 'track-plan-days');
        for (var slotIndex = 0; slotIndex < ch.duration; slotIndex += 1) {
          var slotKey = shiftKey(ch.startDate, slotIndex);
          var slotRest = isRestDay(slotKey);
          var slotRow = makeEl('li', 'track-plan-day' +
            (slotKey === todayKey ? ' is-today' : '') +
            (slotRest ? ' is-rest' : ''));
          var slotHead = makeEl('div', 'track-plan-head');
          slotHead.dir = 'ltr';
          slotHead.appendChild(makeEl('b', 'track-plan-dayno', 'Day ' + (slotIndex + 1)));
          slotHead.appendChild(makeEl('span', 'track-plan-date', shortDate(slotKey)));
          if (slotRest) {
            slotHead.appendChild(makeEl('span', 'track-plan-tag is-rest', 'rest'));
          } else if (slotKey <= todayKey && challengeDayComplete(ch, slotKey)) {
            slotHead.appendChild(makeEl('span', 'track-plan-tag is-won', 'won'));
          }
          slotRow.appendChild(slotHead);
          challengeItemsFor(ch, slotKey).forEach(function (entry) {
            var line = makeEl('p', 'track-plan-item', entry.title);
            line.dir = 'auto';
            slotRow.appendChild(line);
          });
          planList.appendChild(slotRow);
        }
        planInner.appendChild(planList);
        planWrap.appendChild(planInner);

        planToggle.addEventListener('click', function () {
          var next = !planToggle.classList.contains('is-open');
          planToggle.classList.toggle('is-open', next);
          planToggle.setAttribute('aria-expanded', next ? 'true' : 'false');
          planWrap.classList.toggle('is-open', next);
          planToggleText.textContent = next
            ? 'Hide the day plan'
            : 'Show all ' + ch.duration + ' days';
          if (next) openBuildCards[ch.id] = true;
          else delete openBuildCards[ch.id];
        });

        card.appendChild(planToggle);
        card.appendChild(planWrap);
      }

      if (st.kind === 'scheduled') {
        var preview = makeEl('div', 'track-check');
        preview.appendChild(makeEl('p', 'track-check-label',
          build
            ? 'Starts ' + shortDate(ch.startDate) + ' · Day 1 milestone'
            : 'Starts ' + shortDate(ch.startDate) + ' · daily checklist'));
        var previewList = makeEl('ul', 'mini-list');
        var previewItems = build ? challengeItemsFor(ch, ch.startDate) : ch.daily;
        /* Read-only here: no check circle. Ticking happens on Today. */
        previewItems.forEach(function (item) {
          var li = makeEl('li', 'mini-item');
          li.dir = textDir(item.title);
          var text = makeEl('span', 'mini-text', item.title);
          text.dir = 'auto';
          li.appendChild(text);
          previewList.appendChild(li);
        });
        preview.appendChild(previewList);
        card.appendChild(preview);
      } else if (st.kind === 'live') {
        var block = makeEl('div', 'track-check');
        block.appendChild(makeEl('p', 'track-check-label',
          todayRest
            ? 'Rest day · streak frozen'
            : build
              ? 'Today · Day ' + st.day + ' milestone · check off on Today'
              : 'Today · day ' + st.day + ' · check off on Today'));
        var listEl = makeEl('ul', 'mini-list');
        var doneIds = ch.log[todayKey] || [];
        /* Status only, never a control: the Challenges tab carries no check
           circle at all. Today is the one place a daily action is ticked. */
        todayItems.forEach(function (item) {
          var done = doneIds.indexOf(item.id) !== -1;
          var li = makeEl('li', 'mini-item' + (done ? ' is-done' : ''));
          li.dir = textDir(item.title);
          var text = makeEl('span', 'mini-text', item.title);
          text.dir = 'auto';
          li.appendChild(text);
          listEl.appendChild(li);
        });
        block.appendChild(listEl);
        card.appendChild(block);
      } else if (st.kind === 'won') {
        card.appendChild(makeEl('p', 'track-check-label', 'Every day won. Run it back?'));
      } else {
        card.appendChild(makeEl('p', 'track-check-label',
          'Window closed · ' + st.won + ' of ' + st.activeDays + ' active days won.'));
      }

      var canRestart = st.kind === 'won' || st.kind === 'over';
      if (canRestart || manageChallenges) {
        var actions = makeEl('div', 'track-actions');
        if (canRestart) {
          var start = makeEl('button', 'track-btn is-primary', 'Run it again');
          start.type = 'button';
          start.addEventListener('click', function () {
            ch.startDate = todayKey;
            ch.endDate = shiftKey(todayKey, ch.duration - 1);
            ch.startedAt = todayKey;
            ch.log = {};
            save();
            renderAll();
            toast('✓ Challenge restarted · day 1');
          });
          actions.appendChild(start);
        }
        if (manageChallenges) {
          actions.appendChild(editButton('Configure ' + ch.title, function () {
            openTrackSheet('challenge', ch);
          }));
          actions.appendChild(deleteButton('Delete ' + ch.title, function () {
            askDelete('challenge', ch.title, function () { removeChallenge(ch); });
          }));
        }
        card.appendChild(actions);
      }

      els.challengeList.appendChild(card);
    });

    els.challengesEmpty.hidden = state.challenges.length > 0;
  }

  function toggleChallengeItem(ch, itemId, dayKey) {
    var key = dayKey || todayKey;
    /* A rest day takes no ticks at all — not even an undo. */
    if (isRestDay(key)) {
      toast('Rest day · challenge check-offs are paused');
      return;
    }
    if (!ch.log) ch.log = {};
    var list = (ch.log[key] || []).slice();
    var index = list.indexOf(itemId);
    var adding = index === -1;

    if (adding) list.push(itemId);
    else list.splice(index, 1);

    if (list.length) ch.log[key] = list;
    else delete ch.log[key];

    save();
    renderAll();

    if (!adding || key !== todayKey) return;

    var all = challengeDayComplete(ch, todayKey);

    if (challengeWonDays(ch) >= challengeActiveDays(ch)) {
      toast('Challenge won — every active day cleared');
    } else if (all) {
      toast('Day ' + (daysBetween(ch.startDate, todayKey) + 1) + ' won');
    } else {
      vibrate(8);
    }
  }

  /* ------------------------------- workouts ------------------------------ */

  function workoutById(id) {
    for (var i = 0; i < state.workouts.length; i++) {
      if (state.workouts[i].id === id) return state.workouts[i];
    }
    return null;
  }

  function workoutEntry(w, key) {
    return w.log && w.log[key] ? w.log[key] : null;
  }

  function workoutDoneIds(w, key) {
    var entry = workoutEntry(w, key);
    return entry && Array.isArray(entry.done) ? entry.done : [];
  }

  function workoutComplete(w, key) {
    var entry = workoutEntry(w, key);
    if (!entry) return false;
    if (entry.finished) return true;
    return w.exercises.length > 0 && entry.done.length >= w.exercises.length;
  }

  function workoutPartial(w, key) {
    var entry = workoutEntry(w, key);
    return !!entry && !workoutComplete(w, key);
  }

  function workoutDose(exercise) {
    var unit = exercise.unit === 'sec' ? 's' : '';
    if (exercise.sets && exercise.reps) return exercise.sets + ' × ' + exercise.reps + unit;
    if (exercise.reps) return exercise.reps + (exercise.unit === 'sec' ? 's' : ' reps');
    if (exercise.sets) return exercise.sets + ' sets';
    return '';
  }

  function toggleWorkoutExercise(w, exerciseId) {
    var belongs = w.exercises.some(function (exercise) { return exercise.id === exerciseId; });
    if (!belongs) return;

    if (!w.log) w.log = {};
    var entry = w.log[todayKey];
    if (!entry) entry = w.log[todayKey] = { started: true, done: [], finished: false };
    entry.started = true;

    var list = (Array.isArray(entry.done) ? entry.done : []).slice();
    var index = list.indexOf(exerciseId);
    var adding = index === -1;
    if (adding) list.push(exerciseId);
    else list.splice(index, 1);

    entry.done = list;
    entry.finished = false;

    var completeNow = w.exercises.length > 0 && list.length >= w.exercises.length;
    if (completeNow) entry.finished = true;

    save();
    renderAll();

    if (adding) vibrate(8);
    if (completeNow) {
      toast('✓ Workout complete · ' + w.title);
      /* Every exercise ticked: close the session and clear the builder so the
         next workout starts from a clean plan. */
      if (builder.sessionId === w.id) finishSession(w, true);
    } else if (builder.sessionId === w.id) {
      renderStudio();
    }
  }

  function finishWorkout(w) {
    var entry = workoutEntry(w, todayKey);
    if (!entry) return;
    entry.finished = true;
    save();
    finishSession(w);
  }

  function removeWorkout(w) {
    state.workouts = state.workouts.filter(function (item) { return item.id !== w.id; });
    save();
    renderAll();
    toast('✓ Workout deleted');
  }

  /* ---------------------------- workout studio --------------------------- */

  /* The builder is a draft until it is saved: exercises, target time and the
     live coverage/quality scores all live here, not in the stored state. */
  var builder = {
    editId: null,
    sessionId: null,
    title: '',
    why: '',
    days: [],
    weeks: 4,
    startDate: keyOf(new Date()),
    target: 35,
    exercises: [],
    filter: 'all',
    customGroup: 'chest',
    error: ''
  };

  function resetBuilder() {
    builder = {
      editId: null,
      sessionId: null,
      title: '',
      why: '',
      days: [],
      weeks: 4,
      startDate: keyOf(new Date()),
      target: 35,
      exercises: [],
      filter: 'all',
      customGroup: 'chest',
      error: ''
    };
  }

  function exerciseGroups(exercise) {
    var out = [];
    if (isGroup(exercise.group)) out.push(exercise.group);
    var entry = libraryEntry(exercise.name);
    if (entry) {
      if (out.indexOf(entry.group) === -1) out.push(entry.group);
      (entry.also || []).forEach(function (key) {
        if (isGroup(key) && out.indexOf(key) === -1) out.push(key);
      });
    }
    return out;
  }

  /* Rough clock model: a rep ≈ 3s of work, a hold is its own seconds, every
     set gets 40s of rest, plus a warm-up and a transition per movement. */
  function exerciseMinutes(exercise) {
    var sets = exercise.sets || 0;
    if (!sets) return 0;
    var work = exercise.unit === 'sec' ? (exercise.reps || 30) : (exercise.reps || 10) * 3;
    return (sets * (work + 40)) / 60;
  }

  function planMinutes(exercises) {
    if (!exercises.length) return 0;
    var minutes = 2;
    exercises.forEach(function (exercise) { minutes += exerciseMinutes(exercise); });
    return Math.max(1, Math.round(minutes + exercises.length * 0.75));
  }

  function planCoverage(exercises) {
    var sets = {};
    var counts = {};
    MUSCLE_GROUPS.forEach(function (group) {
      sets[group.key] = 0;
      counts[group.key] = 0;
    });
    exercises.forEach(function (exercise) {
      exerciseGroups(exercise).forEach(function (key) {
        sets[key] += exercise.sets || 0;
        counts[key] += 1;
      });
    });
    var covered = MUSCLE_GROUPS.filter(function (group) {
      return counts[group.key] > 0;
    }).map(function (group) { return group.key; });
    return { sets: sets, counts: counts, covered: covered };
  }

  function planQuality(exercises, target) {
    var minutes = planMinutes(exercises);
    var coverage = planCoverage(exercises);
    var totalSets = exercises.reduce(function (sum, exercise) {
      return sum + (exercise.sets || 0);
    }, 0);

    var coverageScore = coverage.covered.length / MUSCLE_GROUPS.length;
    var groupedSets = MUSCLE_GROUPS.reduce(function (sum, group) {
      return sum + coverage.sets[group.key];
    }, 0);
    var maxShare = 0;
    MUSCLE_GROUPS.forEach(function (group) {
      if (!groupedSets) return;
      maxShare = Math.max(maxShare, coverage.sets[group.key] / groupedSets);
    });
    /* A single muscle swallowing most of the volume is not a balanced plan. */
    var balanceScore = totalSets ? Math.max(0, 1 - Math.max(0, maxShare - 0.45) / 0.55) : 0;
    var goal = Math.max(10, target || 35);
    var fitScore = minutes ? Math.max(0, 1 - Math.abs(minutes - goal) / goal) : 0;
    if (minutes >= goal * 0.85 && minutes <= goal * 1.15) fitScore = 1;
    var varietyScore = Math.min(1, exercises.length / 6);

    var score = exercises.length
      ? Math.round(100 * (
        coverageScore * 0.45 + balanceScore * 0.2 + fitScore * 0.2 + varietyScore * 0.15
      ))
      : 0;

    var grade;
    var tone;
    if (!exercises.length) { grade = 'Empty'; tone = 'none'; }
    else if (score < 45) { grade = 'Thin'; tone = 'low'; }
    else if (score < 65) { grade = 'Building'; tone = 'mid'; }
    else if (score < 80) { grade = 'Solid'; tone = 'good'; }
    else if (score < 90) { grade = 'Balanced'; tone = 'great'; }
    else { grade = 'Complete'; tone = 'peak'; }

    var missing = MUSCLE_GROUPS.filter(function (group) {
      return coverage.counts[group.key] === 0;
    });
    var tip;
    if (!exercises.length) {
      tip = 'Add movements from the library to score this session.';
    } else if (missing.length && coverageScore < 0.8) {
      tip = 'Add ' + groupLabel(missing[0].key).toLowerCase() + ' work to round it out.';
    } else if (minutes < goal * 0.85) {
      tip = '≈' + Math.max(1, goal - minutes) + ' min short — add a set or one more movement.';
    } else if (minutes > goal * 1.15) {
      tip = 'Over target — trim a set to land near ' + goal + ' min.';
    } else {
      tip = missing.length
        ? 'Close — ' + groupLabel(missing[0].key).toLowerCase() + ' is still light.'
        : 'Well rounded and on time. Ready to train.';
    }

    return {
      score: score,
      grade: grade,
      tone: tone,
      tip: tip,
      minutes: minutes,
      coverage: coverage,
      fullBody: coverage.covered.length >= 4 && exercises.length >= 3
    };
  }

  function openBuilder(workout) {
    builder.filter = 'all';
    builder.customGroup = 'chest';
    builder.error = '';
    builder.sessionId = null;

    if (!workout) {
      /* From the hub, start from today's scheduled session if there is one. */
      workout = state.workouts.filter(function (w) {
        return workoutScheduledOn(w, todayKey) && !workoutComplete(w, todayKey);
      })[0] || null;
    }

    if (workout) {
      builder.editId = workout.id;
      builder.title = workout.title;
      builder.why = workout.why || '';
      builder.days = workout.days.slice();
      builder.weeks = workout.weeks || 4;
      builder.startDate = workout.startDate || keyOf(new Date());
      builder.target = workout.target || 35;
      builder.exercises = workout.exercises.map(function (exercise) {
        return {
          id: exercise.id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          group: exercise.group || groupFromName(exercise.name),
          unit: exercise.unit === 'sec' ? 'sec' : 'reps'
        };
      });
    } else {
      builder.editId = null;
      builder.title = '';
      builder.why = '';
      builder.days = [fromKey(todayKey).getDay()];
      builder.weeks = 4;
      builder.startDate = todayKey;
      builder.target = 35;
      builder.exercises = [];
    }

    showStudio();
    renderStudio();
    els.studioBody.scrollTop = 0;
  }

  function openSession(w) {
    if (!w.log) w.log = {};
    var entry = w.log[todayKey];
    if (!entry) w.log[todayKey] = { started: true, done: [], finished: false };
    else entry.started = true;
    save();
    renderAll();

    builder.sessionId = w.id;
    builder.editId = null;
    showStudio();
    renderStudio();
    els.studioBody.scrollTop = 0;
  }

  function showStudio() {
    els.studio.hidden = false;
    document.body.classList.add('studio-open');
  }

  function closeStudio() {
    els.studio.hidden = true;
    document.body.classList.remove('studio-open');
  }

  function finishSession(w, quiet) {
    var entry = workoutEntry(w, todayKey);
    if (entry) {
      entry.finished = true;
      save();
    }
    closeStudio();
    resetBuilder();
    renderAll();
    if (!quiet) {
      toast('✓ Session logged · ' + w.title + ' · ' + planMinutes(w.exercises) + ' min');
    }
  }

  function commitBuilderWorkout() {
    var title = trimText(builder.title, MAX_TITLE) || 'Custom Session';
    var coverage = planCoverage(builder.exercises);
    var focus = coverage.covered.length === MUSCLE_GROUPS.length
      ? 'Full body'
      : (coverage.covered.length
        ? coverage.covered.map(groupLabel).join(' · ')
        : 'Full body');

    var exercises = builder.exercises.map(function (exercise) {
      return {
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        group: exercise.group,
        unit: exercise.unit
      };
    });

    var existing = builder.editId ? workoutById(builder.editId) : null;
    if (existing) {
      existing.title = title;
      existing.why = trimText(builder.why, MAX_WHY);
      existing.focus = focus;
      existing.days = builder.days.slice().sort(function (a, b) { return a - b; });
      existing.weeks = builder.weeks;
      existing.startDate = builder.startDate;
      existing.target = builder.target;
      existing.exercises = exercises;

      var valid = {};
      exercises.forEach(function (exercise) { valid[exercise.id] = true; });
      Object.keys(existing.log).forEach(function (key) {
        var entry = existing.log[key];
        entry.done = (entry.done || []).filter(function (id) { return valid[id]; });
        if (!entry.started && !entry.done.length) delete existing.log[key];
      });
    } else {
      existing = {
        id: uid(),
        title: title,
        why: trimText(builder.why, MAX_WHY),
        focus: focus,
        days: builder.days.slice().sort(function (a, b) { return a - b; }),
        weeks: builder.weeks,
        startDate: builder.startDate,
        target: builder.target,
        exercises: exercises,
        log: {},
        createdAt: Date.now()
      };
      state.workouts.unshift(existing);
      builder.editId = existing.id;
    }

    save();
    return existing;
  }

  function addLibraryExercise(name) {
    var entry = libraryEntry(name);
    if (!entry) return;
    var exercise = normalizeExercise({
      name: entry.name,
      sets: entry.sets,
      reps: entry.reps,
      group: entry.group,
      unit: entry.unit
    });
    if (!exercise) return;
    if (builder.exercises.length >= MAX_ITEMS) {
      builder.error = 'A session holds up to ' + MAX_ITEMS + ' exercises.';
      return;
    }
    builder.exercises.push(exercise);
    builder.error = '';
    vibrate(6);
  }

  function addCustomExercise() {
    var nameEl = document.getElementById('studioCustomName');
    var groupEl = document.getElementById('studioCustomGroup');
    var setsEl = document.getElementById('studioCustomSets');
    var repsEl = document.getElementById('studioCustomReps');
    var name = trimText(nameEl ? nameEl.value : '', MAX_TITLE);
    if (!name) {
      builder.error = 'Name the custom exercise first.';
      renderStudio();
      return;
    }

    if (builder.exercises.length >= MAX_ITEMS) {
      builder.error = 'A session holds up to ' + MAX_ITEMS + ' exercises.';
      renderStudio();
      return;
    }

    var entry = libraryEntry(name);
    builder.exercises.push({
      id: uid(),
      name: name,
      sets: clampInt(setsEl ? setsEl.value : 3, 1, 20, 3),
      reps: clampInt(repsEl ? repsEl.value : 12, 1, 100, entry ? entry.reps : 12),
      group: groupEl && isGroup(groupEl.value)
        ? groupEl.value
        : (entry ? entry.group : groupFromName(name)),
      unit: entry && entry.unit === 'sec' ? 'sec' : 'reps'
    });
    builder.error = '';
    vibrate(8);
    renderStudio();
  }

  function studioCard(title, note) {
    var card = makeEl('section', 'studio-card');
    var head = makeEl('div', 'studio-card-head');
    head.appendChild(makeEl('h3', null, title));
    if (note) head.appendChild(makeEl('span', 'studio-card-note', note));
    card.appendChild(head);
    return card;
  }

  function buildStudioSetup() {
    var card = studioCard('Session');
    var label = makeEl('label', 'studio-field');
    label.appendChild(makeEl('span', 'studio-field-label', 'Workout name'));
    var input = makeEl('input', 'studio-input');
    input.id = 'studioName';
    input.type = 'text';
    input.maxLength = MAX_TITLE;
    input.dir = 'auto';
    input.placeholder = 'e.g. Full Body Circuit';
    input.value = builder.title;
    input.setAttribute('enterkeyhint', 'done');
    label.appendChild(input);
    card.appendChild(label);

    if (builder.error) card.appendChild(makeEl('p', 'studio-error', builder.error));

    card.appendChild(makeEl('p', 'studio-field-label', 'Training days'));
    var days = makeEl('div', 'studio-days');
    DAY_LABELS.forEach(function (text, index) {
      var on = builder.days.indexOf(index) !== -1;
      var btn = makeEl('button', 'studio-day' + (on ? ' is-on' : ''), text);
      btn.type = 'button';
      btn.dataset.day = String(index);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-label', DAY_LABELS_LONG[index]);
      days.appendChild(btn);
    });
    card.appendChild(days);
    return card;
  }

  function buildStudioTime() {
    var card = studioCard('Target time', '30–45 min sweet spot');
    var row = makeEl('div', 'studio-time');
    [30, 45].forEach(function (minutes) {
      var active = builder.target === minutes;
      var btn = makeEl('button', 'studio-preset' + (active ? ' is-on' : ''), minutes + 'm');
      btn.type = 'button';
      btn.dataset.target = String(minutes);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      row.appendChild(btn);
    });

    var custom = makeEl('label', 'studio-minutes');
    var num = makeEl('input');
    num.id = 'studioMinutes';
    num.type = 'number';
    num.inputMode = 'numeric';
    num.min = '10';
    num.max = '120';
    num.step = '5';
    num.value = String(builder.target);
    num.setAttribute('aria-label', 'Custom target minutes');
    custom.appendChild(num);
    custom.appendChild(makeEl('span', null, 'min'));
    row.appendChild(custom);
    card.appendChild(row);

    var quality = planQuality(builder.exercises, builder.target);
    var estimate = makeEl('p', 'studio-estimate');
    estimate.id = 'studioEstimate';
    estimate.textContent = '≈ ' + quality.minutes + ' min planned'
      + (builder.target >= 30 && builder.target <= 45 ? ' · in the target zone' : '');
    card.appendChild(estimate);
    return card;
  }

  /* The program step: pick how many weeks it runs, then read the actual dates
     as training days and rest days before the session is ever saved. */
  function buildStudioSchedule() {
    var sessions = builder.weeks * builder.days.length;
    var card = studioCard('Program', builder.weeks + ' week' + (builder.weeks === 1 ? '' : 's'));

    var row = makeEl('div', 'studio-time');
    [2, 4, 6, 8].forEach(function (weeks) {
      var active = builder.weeks === weeks;
      var btn = makeEl('button', 'studio-preset' + (active ? ' is-on' : ''), weeks + 'w');
      btn.type = 'button';
      btn.dataset.week = String(weeks);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.setAttribute('aria-label', weeks + ' weeks');
      row.appendChild(btn);
    });

    var custom = makeEl('label', 'studio-minutes');
    var num = makeEl('input');
    num.id = 'studioWeeks';
    num.type = 'number';
    num.inputMode = 'numeric';
    num.min = '1';
    num.max = '12';
    num.step = '1';
    num.value = String(builder.weeks);
    num.setAttribute('aria-label', 'Custom program weeks');
    custom.appendChild(num);
    custom.appendChild(makeEl('span', null, 'wk'));
    row.appendChild(custom);
    card.appendChild(row);

    card.appendChild(makeEl('p', 'studio-estimate',
      sessions + ' session' + (sessions === 1 ? '' : 's') + ' · ' +
      (builder.days.length
        ? builder.days.length + ' training day' + (builder.days.length === 1 ? '' : 's') + ' a week'
        : 'pick at least one training day') +
      ' · ' + builder.weeks * 7 + ' days'));

    var start = fromKey(builder.startDate);
    var first = new Date(start);
    first.setDate(start.getDate() - start.getDay());
    var lastKey = shiftKey(builder.startDate, builder.weeks * 7 - 1);

    var head = makeEl('div', 'schedule-week schedule-head');
    head.setAttribute('aria-hidden', 'true');
    DAY_LABELS.forEach(function (label) {
      head.appendChild(makeEl('span', 'schedule-weekday', label.slice(0, 1)));
    });
    card.appendChild(head);

    for (var w = 0; w < builder.weeks; w += 1) {
      var weekRow = makeEl('div', 'schedule-week');
      for (var i = 0; i < 7; i += 1) {
        var date = new Date(first);
        date.setDate(first.getDate() + (w * 7) + i);
        var key = keyOf(date);
        var inWindow = key >= builder.startDate && key <= lastKey;
        var training = inWindow && builder.days.indexOf(date.getDay()) !== -1;
        var cell = makeEl('span', 'schedule-cell' +
          (training ? ' is-workout' : '') +
          (inWindow ? '' : ' is-out') +
          (key === todayKey ? ' is-today' : ''), String(date.getDate()));
        var label = date.toLocaleDateString(undefined, {
          weekday: 'short', month: 'short', day: 'numeric'
        });
        label += !inWindow ? ' — before the program'
          : training ? ' — training day' : ' — rest day';
        cell.setAttribute('aria-label', label);
        cell.title = label;
        weekRow.appendChild(cell);
      }
      card.appendChild(weekRow);
    }

    var legend = makeEl('div', 'schedule-legend');
    legend.appendChild(makeEl('span', 'schedule-key is-workout', 'Training'));
    legend.appendChild(makeEl('span', 'schedule-key is-rest', 'Rest'));
    card.appendChild(legend);
    return card;
  }

  function buildMuscleMap() {
    var coverage = planCoverage(builder.exercises);
    var lit = coverage.covered;
    var fullBody = lit.length >= 4 && builder.exercises.length >= 3;
    var wrap = makeEl('div', 'muscle-wrap');

    var map = makeEl('div', 'muscle-map');
    map.innerHTML = muscleDiagram(lit);
    wrap.appendChild(map);

    var side = makeEl('div', 'muscle-side');
    var count = makeEl('p', 'muscle-count');
    count.appendChild(makeEl('b', null, String(lit.length)));
    count.appendChild(document.createTextNode(' / ' + MUSCLE_GROUPS.length));
    side.appendChild(count);
    side.appendChild(makeEl('p', 'muscle-count-label',
      builder.exercises.length ? 'muscle groups lit' : 'pick a movement'));

    var legend = makeEl('div', 'muscle-legend');
    MUSCLE_GROUPS.forEach(function (group) {
      var on = lit.indexOf(group.key) !== -1;
      legend.appendChild(makeEl('span', 'muscle-tag' + (on ? ' is-on' : ''), group.label));
    });
    side.appendChild(legend);

    var flag = makeEl('div', 'muscle-flag' + (fullBody ? ' is-full' : ''));
    flag.appendChild(makeEl('span', 'muscle-flag-mark', fullBody ? '◆' : '◇'));
    flag.appendChild(makeEl('span', null,
      fullBody ? 'Full Body' : 'Full Body at 4 of 5'));
    side.appendChild(flag);
    wrap.appendChild(side);
    return wrap;
  }

  function balanceLabel(quality) {
    if (!builder.exercises.length) return 'No plan';
    if (quality.score < 45) return 'Weak';
    if (quality.score < 65) return 'Building';
    if (quality.score < 80) return 'Solid';
    if (quality.score < 90) return 'Balanced';
    return 'Complete';
  }

  /* The same red → amber → green language as the day progress bar: no score
     number to decode, just where the plan sits on the scale. */
  function buildBalanceCard() {
    var quality = planQuality(builder.exercises, builder.target);
    var card = makeEl('section', 'studio-card balance-card');
    card.id = 'studioBalanceCard';

    var head = makeEl('div', 'studio-card-head');
    head.appendChild(makeEl('h3', null, 'Balance'));
    head.appendChild(makeEl('span', 'balance-state', balanceLabel(quality)));
    card.appendChild(head);

    var scale = makeEl('div', 'balance-scale');
    scale.style.setProperty('--p', quality.score + '%');
    scale.setAttribute('role', 'progressbar');
    scale.setAttribute('aria-valuemin', '0');
    scale.setAttribute('aria-valuemax', '100');
    scale.setAttribute('aria-valuenow', String(quality.score));
    scale.setAttribute('aria-label', 'Workout balance: ' + balanceLabel(quality));
    scale.appendChild(makeEl('span', 'balance-track'));
    scale.appendChild(makeEl('span', 'balance-fill'));
    var marker = makeEl('span', 'balance-marker');
    marker.setAttribute('aria-hidden', 'true');
    scale.appendChild(marker);
    card.appendChild(scale);

    var meta = makeEl('div', 'balance-meta');
    meta.appendChild(makeEl('span', null, 'Weak'));
    meta.appendChild(makeEl('span', 'balance-meta-mid',
      '≈' + quality.minutes + ' min · ' + quality.coverage.covered.length + ' / 5 muscles'));
    meta.appendChild(makeEl('span', null, 'Strong'));
    card.appendChild(meta);

    card.appendChild(makeEl('p', 'balance-tip', quality.tip));
    return card;
  }

  function buildStudioPlan() {
    var card = studioCard('Session plan',
      builder.exercises.length + ' exercise' + (builder.exercises.length === 1 ? '' : 's'));

    if (!builder.exercises.length) {
      card.appendChild(makeEl('p', 'studio-empty',
        'Nothing selected yet. Tap an exercise below or add your own.'));
      return card;
    }

    var list = makeEl('ul', 'plan-list');
    builder.exercises.forEach(function (exercise) {
      var row = makeEl('li', 'plan-row');
      var main = makeEl('button', 'plan-main');
      main.type = 'button';
      main.dir = 'auto';
      main.dataset.demo = exercise.name;
      main.setAttribute('aria-label', 'How to do ' + exercise.name);
      main.appendChild(makeEl('span', 'plan-name', exercise.name));
      var groups = exerciseGroups(exercise).map(groupLabel).filter(Boolean);
      if (groups.length) {
        main.appendChild(makeEl('span', 'plan-groups', groups.join(' · ')));
      }
      row.appendChild(main);

      var controls = makeEl('div', 'plan-controls');
      controls.dir = 'ltr';
      controls.appendChild(planStepper('Sets', exercise, 'sets', 1, 20));
      controls.appendChild(planStepper(exercise.unit === 'sec' ? 'Sec' : 'Reps',
        exercise, 'reps', 1, 100));
      row.appendChild(controls);

      var remove = makeEl('button', 'plan-remove');
      remove.type = 'button';
      remove.dataset.remove = exercise.id;
      remove.setAttribute('aria-label', 'Remove ' + exercise.name);
      remove.innerHTML = X_SVG;
      row.appendChild(remove);
      list.appendChild(row);
    });
    card.appendChild(list);

    var custom = makeEl('div', 'studio-custom');
    custom.appendChild(makeEl('p', 'studio-field-label', 'Custom exercise'));
    var name = makeEl('input', 'studio-input');
    name.id = 'studioCustomName';
    name.type = 'text';
    name.maxLength = MAX_TITLE;
    name.dir = 'auto';
    name.placeholder = 'e.g. Chair Dips';
    custom.appendChild(name);

    var customRow = makeEl('div', 'studio-custom-row');
    var select = makeEl('select', 'studio-select');
    select.id = 'studioCustomGroup';
    select.setAttribute('aria-label', 'Muscle group');
    MUSCLE_GROUPS.forEach(function (group) {
      var option = makeEl('option', null, group.label);
      option.value = group.key;
      if (builder.customGroup === group.key) option.selected = true;
      select.appendChild(option);
    });
    customRow.appendChild(select);

    [['studioCustomSets', '3', 'sets'], ['studioCustomReps', '12', 'reps']].forEach(function (item) {
      var input = makeEl('input', 'studio-number');
      input.id = item[0];
      input.type = 'number';
      input.inputMode = 'numeric';
      input.min = '1';
      input.max = item[0].indexOf('Sets') !== -1 ? '20' : '100';
      input.value = item[1];
      input.setAttribute('aria-label', 'Custom exercise ' + item[2]);
      customRow.appendChild(input);
    });

    var add = makeEl('button', 'studio-add-custom', 'Add');
    add.type = 'button';
    add.dataset.customAdd = '1';
    customRow.appendChild(add);
    custom.appendChild(customRow);
    card.appendChild(custom);
    return card;
  }

  function planStepper(label, exercise, field, min, max) {
    var wrap = makeEl('span', 'plan-stepper');
    wrap.appendChild(makeEl('span', 'plan-step-label', label));
    var down = makeEl('button', null, '−');
    down.type = 'button';
    down.dataset.step = field;
    down.dataset.id = exercise.id;
    down.dataset.delta = '-1';
    down.setAttribute('aria-label', 'Fewer ' + field);
    wrap.appendChild(down);
    wrap.appendChild(makeEl('b', 'plan-step-value', String(exercise[field] || 0)));
    var up = makeEl('button', null, '+');
    up.type = 'button';
    up.dataset.step = field;
    up.dataset.id = exercise.id;
    up.dataset.delta = '1';
    up.setAttribute('aria-label', 'More ' + field);
    wrap.appendChild(up);
    return wrap;
  }

  function buildStudioLibrary() {
    var card = studioCard('Exercise library', 'Bodyweight · no equipment');

    var filters = makeEl('div', 'library-filters');
    filters.setAttribute('role', 'group');
    filters.setAttribute('aria-label', 'Filter exercises');
    [{ key: 'all', label: 'All' }].concat(MUSCLE_GROUPS).forEach(function (group) {
      var on = builder.filter === group.key;
      var btn = makeEl('button', 'library-filter' + (on ? ' is-on' : ''), group.label);
      btn.type = 'button';
      btn.dataset.filter = group.key;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      filters.appendChild(btn);
    });
    card.appendChild(filters);

    var counts = {};
    builder.exercises.forEach(function (exercise) {
      counts[exercise.name.toLowerCase()] = (counts[exercise.name.toLowerCase()] || 0) + 1;
    });

    var list = makeEl('ul', 'library-list');
    EXERCISE_LIBRARY.forEach(function (entry) {
      if (builder.filter !== 'all' && exerciseGroups(entry).indexOf(builder.filter) === -1) return;
      var row = makeEl('li', 'library-row');
      var main = makeEl('button', 'library-main');
      main.type = 'button';
      main.dir = 'auto';
      main.dataset.demo = entry.name;
      main.setAttribute('aria-label', 'How to do ' + entry.name);
      main.appendChild(makeEl('span', 'library-name', entry.name));
      main.appendChild(makeEl('span', 'library-tag',
        exerciseGroups(entry).map(groupLabel).join(' · ')));
      row.appendChild(main);

      row.appendChild(makeEl('span', 'library-dose',
        entry.sets + ' × ' + entry.reps + (entry.unit === 'sec' ? 's' : '')));

      var added = counts[entry.name.toLowerCase()] || 0;
      var btn = makeEl('button', 'library-add' + (added ? ' is-added' : ''),
        added ? '+' + added : '+');
      btn.type = 'button';
      btn.dataset.lib = entry.name;
      btn.setAttribute('aria-label', 'Add ' + entry.name);
      row.appendChild(btn);
      list.appendChild(row);
    });
    card.appendChild(list);
    return card;
  }

  function renderStudioFoot() {
    els.studioFoot.textContent = '';

    var w = builder.sessionId ? workoutById(builder.sessionId) : null;
    if (w) {
      var done = workoutDoneIds(w, todayKey).length;
      var stats = makeEl('div', 'studio-foot-stats');
      stats.appendChild(makeEl('b', null, done + ' / ' + w.exercises.length));
      stats.appendChild(makeEl('span', null, 'exercises done'));
      els.studioFoot.appendChild(stats);

      var finish = makeEl('button', 'studio-action is-primary', 'Finish workout');
      finish.type = 'button';
      finish.dataset.studioAction = 'finish';
      els.studioFoot.appendChild(finish);
      return;
    }

    var quality = planQuality(builder.exercises, builder.target);
    var stats = makeEl('div', 'studio-foot-stats');
    stats.appendChild(makeEl('b', null, '≈ ' + quality.minutes + ' min'));
    stats.appendChild(makeEl('span', null,
      quality.coverage.covered.length + ' of ' + MUSCLE_GROUPS.length + ' muscle groups'));
    els.studioFoot.appendChild(stats);

    var save = makeEl('button', 'studio-action is-ghost', builder.editId ? 'Save' : 'Save only');
    save.type = 'button';
    save.dataset.studioAction = 'save';
    els.studioFoot.appendChild(save);

    var start = makeEl('button', 'studio-action is-primary', 'Start workout');
    start.type = 'button';
    start.dataset.studioAction = 'start';
    els.studioFoot.appendChild(start);
  }

  function paintStudioStats() {
    var estimate = document.getElementById('studioEstimate');
    if (estimate) {
      var quality = planQuality(builder.exercises, builder.target);
      estimate.textContent = '≈ ' + quality.minutes + ' min planned'
        + (builder.target >= 30 && builder.target <= 45 ? ' · in the target zone' : '');
    }

    var coverage = document.getElementById('studioCoverage');
    if (coverage) {
      coverage.textContent = '';
      coverage.appendChild(buildMuscleMap());
    }

    var balance = document.getElementById('studioBalanceCard');
    if (balance) balance.parentNode.replaceChild(buildBalanceCard(), balance);

    renderStudioFoot();
  }

  function renderStudio() {
    if (els.studio.hidden) return;

    if (builder.sessionId) {
      renderSessionStudio();
      return;
    }

    els.studioKicker.textContent = builder.editId ? 'Edit session' : 'Workout builder';
    els.studioTitle.textContent = 'Build a workout';
    els.studioTitle.dir = 'auto';

    var scroll = els.studioBody.scrollTop;
    els.studioBody.textContent = '';
    els.studioBody.appendChild(buildStudioSetup());
    els.studioBody.appendChild(buildBalanceCard());
    els.studioBody.appendChild(buildStudioSchedule());
    els.studioBody.appendChild(buildStudioTime());

    var muscleCard = studioCard('Muscles', 'Tap a movement for its demo');
    var coverage = makeEl('div');
    coverage.id = 'studioCoverage';
    coverage.appendChild(buildMuscleMap());
    muscleCard.appendChild(coverage);
    els.studioBody.appendChild(muscleCard);

    els.studioBody.appendChild(buildStudioPlan());
    els.studioBody.appendChild(buildStudioLibrary());
    els.studioBody.scrollTop = scroll;

    renderStudioFoot();
  }

  function renderSessionStudio() {
    var w = workoutById(builder.sessionId);
    if (!w) {
      closeStudio();
      resetBuilder();
      return;
    }

    els.studioKicker.textContent = 'In session';
    els.studioTitle.textContent = w.title;
    els.studioTitle.dir = 'auto';

    var done = workoutDoneIds(w, todayKey);
    var pct = w.exercises.length
      ? Math.round((done.length / w.exercises.length) * 100)
      : 0;

    var scroll = els.studioBody.scrollTop;
    els.studioBody.textContent = '';

    var summary = makeEl('section', 'studio-card session-summary');
    var summaryTop = makeEl('div', 'session-summary-top');
    var summaryCopy = makeEl('div');
    summaryCopy.appendChild(makeEl('p', 'studio-field-label',
      w.focus || 'Training session'));
    var count = makeEl('p', 'session-count');
    count.appendChild(makeEl('b', null, String(done.length)));
    count.appendChild(document.createTextNode(' of ' + w.exercises.length + ' done'));
    summaryCopy.appendChild(count);
    summaryTop.appendChild(summaryCopy);
    var target = makeEl('span', 'session-target', '~' + (w.target || 35) + ' min');
    summaryTop.appendChild(target);
    summary.appendChild(summaryTop);

    var meter = makeEl('div', 'quality-meter session-meter');
    var fill = makeEl('span');
    fill.style.width = pct + '%';
    meter.appendChild(fill);
    summary.appendChild(meter);
    els.studioBody.appendChild(summary);

    var listCard = studioCard('Exercises', 'Tap to tick off each set');
    var list = makeEl('ul', 'session-list');
    w.exercises.forEach(function (exercise) {
      var complete = done.indexOf(exercise.id) !== -1;
      var row = makeEl('li', 'session-row' + (complete ? ' is-done' : ''));
      var btn = makeEl('button', 'session-toggle');
      btn.type = 'button';
      btn.dataset.sessionToggle = exercise.id;
      btn.setAttribute('role', 'checkbox');
      btn.setAttribute('aria-checked', complete ? 'true' : 'false');
      btn.setAttribute('aria-label',
        (complete ? 'Undo: ' : 'Complete: ') + exercise.name);

      var mark = makeEl('span', 'mini-check');
      mark.innerHTML = CHECK_SVG;
      btn.appendChild(mark);

      var main = makeEl('span', 'session-main');
      main.dir = 'auto';
      main.appendChild(makeEl('span', 'session-name', exercise.name));
      main.appendChild(makeEl('span', 'session-groups',
        exerciseGroups(exercise).map(groupLabel).join(' · ')));
      btn.appendChild(main);

      btn.appendChild(makeEl('span', 'session-dose', workoutDose(exercise)));
      row.appendChild(btn);

      var guide = makeEl('button', 'session-guide');
      guide.type = 'button';
      guide.dataset.demo = exercise.name;
      guide.setAttribute('aria-label', 'How to do ' + exercise.name);
      guide.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="9"/><path d="M10 8.6l5 3.4-5 3.4z"/></svg>';
      row.appendChild(guide);
      list.appendChild(row);
    });
    listCard.appendChild(list);
    els.studioBody.appendChild(listCard);

    var note = makeEl('p', 'session-note',
      'Every exercise auto-completes the session. Finish early and it still logs what you did.');
    els.studioBody.appendChild(note);
    els.studioBody.scrollTop = scroll;

    renderStudioFoot();
  }

  function onStudioClick(event) {
    var target = event.target.closest && event.target.closest(
      '[data-lib],[data-remove],[data-step],[data-target],[data-week],[data-filter],[data-day],' +
      '[data-custom-add],[data-session-toggle],[data-studio-action]');
    if (!target) return;

    if (target.dataset.studioAction) {
      var action = target.dataset.studioAction;
      if (action === 'save' || action === 'start') {
        if (!builder.exercises.length) {
          builder.error = 'Add at least one exercise before saving or starting.';
          renderStudio();
          return;
        }
        var workout = commitBuilderWorkout();
        if (action === 'start') {
          openSession(workout);
        } else {
          closeStudio();
          resetBuilder();
          renderAll();
          toast('✓ Workout saved · ' + workout.title);
        }
      } else if (action === 'finish') {
        var session = builder.sessionId ? workoutById(builder.sessionId) : null;
        if (session) finishWorkout(session);
      }
      return;
    }

    if (target.dataset.lib) {
      addLibraryExercise(target.dataset.lib);
      renderStudio();
      return;
    }

    if (target.dataset.remove) {
      builder.exercises = builder.exercises.filter(function (exercise) {
        return exercise.id !== target.dataset.remove;
      });
      renderStudio();
      return;
    }

    if (target.dataset.step) {
      var exercise = builder.exercises.filter(function (item) {
        return item.id === target.dataset.id;
      })[0];
      if (!exercise) return;
      var field = target.dataset.step === 'sets' ? 'sets' : 'reps';
      var next = (exercise[field] || 0) + Number(target.dataset.delta || 0);
      exercise[field] = Math.max(1, Math.min(field === 'sets' ? 20 : 100, next));
      renderStudio();
      return;
    }

    if (target.dataset.target) {
      builder.target = Number(target.dataset.target);
      renderStudio();
      return;
    }

    if (target.dataset.week) {
      builder.weeks = Number(target.dataset.week);
      renderStudio();
      return;
    }

    if (target.dataset.filter) {
      builder.filter = target.dataset.filter;
      renderStudio();
      return;
    }

    if (target.dataset.day != null) {
      var day = Number(target.dataset.day);
      var index = builder.days.indexOf(day);
      if (index === -1) builder.days.push(day);
      else builder.days.splice(index, 1);
      renderStudio();
      return;
    }

    if (target.dataset.customAdd) {
      addCustomExercise();
      return;
    }

    if (target.dataset.sessionToggle) {
      var current = builder.sessionId ? workoutById(builder.sessionId) : null;
      if (current) toggleWorkoutExercise(current, target.dataset.sessionToggle);
    }
  }

  function onStudioInput(event) {
    var target = event.target;
    if (target.id === 'studioName') {
      builder.title = target.value;
      return;
    }
    if (target.id === 'studioMinutes') {
      var minutes = parseInt(target.value, 10);
      if (minutes >= 10 && minutes <= 120) {
        builder.target = minutes;
        paintStudioStats();
      }
    }
  }

  function onStudioChange(event) {
    if (event.target.id === 'studioCustomGroup') {
      builder.customGroup = event.target.value;
    }
    if (event.target.id === 'studioWeeks') {
      var weeks = parseInt(event.target.value, 10);
      if (weeks >= 1 && weeks <= 12) {
        builder.weeks = weeks;
        renderStudio();
      }
    }
  }

  /* --------------------------- exercise guide ---------------------------- */

  var demo = { open: false, returnFocus: null };

  function openDemo(name) {
    var text = trimText(name, MAX_TITLE);
    if (!text) return;
    var entry = libraryEntry(text);
    var exercise = {
      name: text,
      group: entry ? entry.group : groupFromName(text)
    };
    var groups = exerciseGroups(exercise);
    var motion = exerciseMotion(exercise);

    demo.returnFocus = document.activeElement;
    demo.open = true;

    els.demoTitle.textContent = text;
    els.demoTitle.dir = 'auto';
    els.demoKicker.textContent = (MOTION_LABELS[motion] || 'Movement') + ' · demo';
    els.demoStage.innerHTML = exerciseFigure(motion);
    els.demoBody.innerHTML = muscleDiagram(groups);
    els.demoCue.textContent = exerciseCue(exercise);
    els.demoCue.dir = 'auto';
    els.demoDose.textContent = entry
      ? entry.sets + ' × ' + entry.reps + (entry.unit === 'sec' ? 's hold' : ' reps')
      : '3 sets';

    els.demoTags.textContent = '';
    if (groups.length) {
      groups.forEach(function (key) {
        els.demoTags.appendChild(makeEl('span', 'demo-tag', groupLabel(key)));
      });
    } else {
      els.demoTags.appendChild(makeEl('span', 'demo-tag is-muted', 'No target'));
    }

    els.demo.hidden = false;
    document.body.classList.add('demo-open');
    if (els.demoClose.focus) els.demoClose.focus({ preventScroll: true });
  }

  function closeDemo() {
    if (!demo.open) return;
    demo.open = false;
    els.demo.hidden = true;
    els.demoStage.textContent = '';
    document.body.classList.remove('demo-open');
    var back = demo.returnFocus;
    demo.returnFocus = null;
    if (back && back.focus && document.contains(back)) {
      back.focus({ preventScroll: true });
    }
  }

  /* -------------------------------- programs ----------------------------- */

  function linkedTaskFor(p, title) {
    var key = String(title || '').toLowerCase();
    for (var i = 0; i < state.tasks.length; i++) {
      var task = state.tasks[i];
      if (task.programId !== p.id) continue;
      if (String(task.programItem || task.title).toLowerCase() === key) return task;
    }
    return null;
  }

  function linkTaskToProgram(task, p, title) {
    task.programId = p.id;
    task.programItem = title;
    /* Program items are owned by the track: they stay out of the user's
       Non-Negotiables and off the live Today score. */
    task.recurring = true;
  }

  /* One-time repair for programs started before tasks carried a link: bind
     the matching task that is already in the list, never invent new ones. */
  function ensureProgramLinks() {
    var changed = false;
    state.programs.forEach(function (p) {
      if (!p.startedAt) return;
      p.items.forEach(function (title) {
        if (linkedTaskFor(p, title)) return;
        for (var i = 0; i < state.tasks.length; i++) {
          var task = state.tasks[i];
          if (task.programId) continue;
          if (task.title.toLowerCase() !== title.toLowerCase()) continue;
          linkTaskToProgram(task, p, title);
          changed = true;
          break;
        }
      });
    });
    if (changed) save();
  }

  var PROGRAM_PHASES = ['Foundation', 'Build', 'Peak'];

  /* ------------------------------ superfocus ----------------------------- */

  /* Every task and challenge action on Today can be chosen for focus. */
  function focusablesToday() {
    var out = [];
    dayItems(todayKey).forEach(function (task) {
      if (task.programId) return;
      out.push({
        id: 'task:' + task.id,
        title: task.title,
        done: isDone(task.id, todayKey),
        kind: 'task'
      });
    });
    challengesOn(todayKey).forEach(function (ch) {
      var log = ch.log[todayKey] || [];
      challengeItemsFor(ch, todayKey).forEach(function (item) {
        out.push({
          id: 'challenge:' + ch.id + ':' + item.id,
          title: item.title,
          done: log.indexOf(item.id) !== -1,
          kind: 'challenge'
        });
      });
    });
    return out;
  }

  /* Stored targets are ids, so a task renamed or removed today can never
     leave a stale blur target behind. */
  function focusTargetsToday() {
    var valid = {};
    focusablesToday().forEach(function (item) { valid[item.id] = true; });
    return (state.focus.targets || []).filter(function (id) {
      return !!valid[id];
    });
  }

  function superfocusOn() {
    return !!state.focus.active && view === 'today' && selectedKey === todayKey;
  }

  function isFocusTarget(id) {
    return superfocusOn() && focusTargetsToday().indexOf(id) !== -1;
  }

  function setFocusTargets(next) {
    var seen = {};
    state.focus.targets = (next || []).filter(function (id) {
      if (typeof id !== 'string' || seen[id]) return false;
      seen[id] = true;
      return true;
    });
    save();
    renderAll();
  }

  function startSuperfocus() {
    if (!focusablesToday().length) {
      state.focus.active = false;
      save();
      renderAll();
      toast('Add a task first · Superfocus needs something to hold');
      return;
    }
    selectedKey = todayKey;
    view = 'today';
    state.view = view;
    state.focus.active = true;
    /* Start empty: the choosing happens on Today itself, by tapping. */
    state.focus.targets = [];
    /* Focus is a clean surface: entering it always leaves edit mode, so no
       delete × or edit affordance can survive on screen. */
    editMode = false;
    save();
    /* Hold the exact spot the switch was tapped: entering never scrolls. */
    var keepScroll = window.scrollY || window.pageYOffset || 0;
    renderAll();
    window.scrollTo(0, keepScroll);
    toast('Superfocus on · tap the tasks to keep sharp');
    vibrate(10);
  }

  function stopSuperfocus() {
    state.focus.active = false;
    state.focus.targets = [];
    save();
    renderAll();
    toast('Superfocus off');
  }

  function toggleFocusTarget(id) {
    var list = focusTargetsToday().slice();
    var index = list.indexOf(id);
    if (index === -1) list.push(id);
    else list.splice(index, 1);
    setFocusTargets(list);
  }

  function renderSuperfocus() {
    var on = superfocusOn();
    var targets = on ? focusTargetsToday() : [];

    if (els.focusSwitch) {
      els.focusSwitch.checked = on;
      /* Never disabled: the same switch is how Superfocus is turned off. */
      els.focusSwitch.disabled = false;
    }
    if (els.focusSwitchText) els.focusSwitchText.textContent = on ? 'ON' : 'OFF';

    document.body.classList.toggle('superfocus', on);
    if (els.viewToday) els.viewToday.classList.toggle('is-focusing', on);
    if (els.focusSub) {
      els.focusSub.textContent = on
        ? 'Tap a task on Today to keep it sharp. Tap it again to release it.'
        : 'Turn it on, then tap the tasks on Today you want to keep sharp.';
    }
    if (els.focusModeNote) {
      els.focusModeNote.textContent = !on
        ? 'Turn it on, then tap the tasks you want kept sharp'
        : targets.length
          ? targets.length + ' sharp · tap one to release · switch off to finish'
          : 'Nothing sharp yet · tap a task on Today';
    }

    Array.prototype.forEach.call(
      document.querySelectorAll('.sf-keep'),
      function (el) { el.classList.remove('sf-keep'); }
    );
    if (!on) return;

    /* The task lists stay legible and tappable so a task can be chosen in
       place; the chrome around them — logo, week strip, scale, headers — is
       what blurs away. */
    Array.prototype.forEach.call(
      document.querySelectorAll('#viewToday .section'),
      function (section) { section.classList.add('sf-keep'); }
    );
  }

  /* -------------------------------- render all ---------------------------- */

  /* A month of real outcomes: green for a cleared day, red for a lost one,
     and quiet grey for a day that carried nothing to judge. */
  function renderCalendar() {
    var year = calCursor.getFullYear();
    var month = calCursor.getMonth();
    var title = new Date(year, month, 1).toLocaleDateString(undefined, {
      month: 'long', year: 'numeric'
    });
    els.calMonth.textContent = title;

    els.calWeekdays.textContent = '';
    DAY_LABELS.forEach(function (label) {
      els.calWeekdays.appendChild(makeEl('span', 'cal-weekday', label.slice(0, 1)));
    });

    els.calGrid.textContent = '';
    var first = new Date(year, month, 1);
    var offset = first.getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    for (var blank = 0; blank < offset; blank += 1) {
      var gap = makeEl('span', 'cal-cell is-blank');
      gap.setAttribute('aria-hidden', 'true');
      els.calGrid.appendChild(gap);
    }

    var wins = 0;
    var losses = 0;
    var rests = 0;
    for (var day = 1; day <= daysInMonth; day += 1) {
      var date = new Date(year, month, day);
      var key = keyOf(date);
      var future = key > todayKey;
      var result = future ? null : dayResult(key);
      var rest = !future && result.rest;
      var stateName = future ? 'future'
        : rest ? 'rest'
          : (result.total === 0 ? 'empty' : (result.won ? 'win' : 'loss'));
      if (!future && rest) rests += 1;
      else if (!future && result.total) {
        if (result.won) wins += 1;
        else losses += 1;
      }

      var cell = makeEl('button', 'cal-cell is-' + stateName +
        (key === todayKey ? ' is-today' : '') +
        (key === selectedKey ? ' is-selected' : ''));
      cell.type = 'button';
      cell.appendChild(makeEl('span', 'cal-day', String(day)));
      if (!future) {
        cell.appendChild(makeEl('span', 'cal-mark',
          rest ? 'R' : result.total === 0 ? '·' : (result.won ? 'W' : 'L')));
      }

      var label = date.toLocaleDateString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric'
      });
      label += future ? ' — not yet'
        : rest ? ' — rest day, streak frozen'
          : result.total === 0 ? ' — nothing scheduled'
            : ' — ' + (result.won ? 'WIN' : 'LOSS') + ', ' + result.done +
              ' of ' + result.total + ' done';
      cell.setAttribute('aria-label', label);
      cell.title = label;
      if (future) {
        cell.disabled = true;
      } else {
        cell.dataset.key = key;
        cell.addEventListener('click', function (event) {
          selectedKey = event.currentTarget.dataset.key;
          setView('today');
        });
      }
      els.calGrid.appendChild(cell);
    }

    els.calWins.textContent = String(wins);
    els.calLosses.textContent = String(losses);
    if (els.calRest) els.calRest.textContent = String(rests);
    if (els.calWinWord) els.calWinWord.textContent = wins === 1 ? 'win' : 'wins';
    if (els.calLossWord) els.calLossWord.textContent = losses === 1 ? 'loss' : 'losses';
    if (els.calRestWord) els.calRestWord.textContent = rests === 1 ? 'rest' : 'rests';
    var decided = wins + losses;
    els.calSub.textContent = decided || rests
      ? wins + ' win' + (wins === 1 ? '' : 's') + ' · ' + losses + ' loss' +
        (losses === 1 ? '' : 'es') +
        (rests ? ' · ' + rests + ' rest day' + (rests === 1 ? '' : 's') : '') +
        ' in ' + title + '.'
      : 'No judged days yet in ' + title + '.';
  }

  function applyView() {
    els.viewToday.hidden = view !== 'today';
    els.viewChallenges.hidden = view !== 'challenges';
    els.viewCalendar.hidden = view !== 'calendar';

    var tabs = els.tabbar.querySelectorAll('.tab');
    Array.prototype.forEach.call(tabs, function (tab) {
      var on = tab.dataset.view === view;
      tab.classList.toggle('is-active', on);
      if (on) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
  }

  function renderAll(flash) {
    todayKey = keyOf(new Date());
    if (selectedKey > todayKey) selectedKey = todayKey;

    /* Superfocus owns the screen: edit affordances are never painted on it. */
    if (superfocusOn()) editMode = false;

    renderWeek();
    renderProgress();
    renderRestState();
    renderLists(flash);
    renderTodayChallenges();
    renderChallenges();
    renderCalendar();

    document.body.classList.toggle('editing', editMode);
    els.editBtn.classList.toggle('is-on', editMode);
    els.editBtn.setAttribute('aria-pressed', editMode ? 'true' : 'false');
    els.editChallenges.classList.toggle('is-on', manageChallenges);
    els.editChallenges.setAttribute('aria-pressed', manageChallenges ? 'true' : 'false');

    applyView();
    renderSuperfocus();
  }

  function setView(next) {
    var target = next === 'challenges' || next === 'calendar' ? next : 'today';
    /* Superfocus is a committed state: tabs stay locked until it is exited. */
    if (superfocusOn() && target !== 'today') {
      toast('Superfocus is on · exit to switch tabs');
      return;
    }
    view = target;
    state.view = view;
    save();
    renderAll();
    window.scrollTo(0, 0);
  }

  /* --------------------------------- sheet ------------------------------- */

  function showError(message) {
    els.formError.textContent = message;
    els.formError.hidden = false;
  }

  function clearError() {
    els.formError.hidden = true;
  }

  function updateDateHint() {
    var start = validDateKey(els.fieldStartDate.value);
    var end = validDateKey(els.fieldEndDate.value);
    if (!start || !end) {
      els.dateHint.textContent = 'Choose a start and end date';
      els.dateHint.classList.remove('is-bad');
      return;
    }
    var days = daysBetween(start, end) + 1;
    els.dateHint.textContent = days >= MIN_DAYS
      ? days + ' days'
      : 'End date must be at least one day after the start';
    els.dateHint.classList.toggle('is-bad', days < MIN_DAYS);
  }

  function syncEndFromDuration() {
    var start = validDateKey(els.fieldStartDate.value) || todayKey;
    var duration = parseInt(els.fieldDuration.value, 10);
    if (!duration || duration < MIN_DAYS || duration > MAX_DAYS) {
      updateDateHint();
      return;
    }
    els.fieldEndDate.value = shiftKey(start, duration - 1);
    updateDateHint();
  }

  function syncDurationFromEnd() {
    var start = validDateKey(els.fieldStartDate.value);
    var end = validDateKey(els.fieldEndDate.value);
    if (start && end) {
      var days = daysBetween(start, end) + 1;
      if (days >= MIN_DAYS && days <= MAX_DAYS) els.fieldDuration.value = String(days);
    }
    updateDateHint();
  }

  function syncDatesFromStart() {
    var start = validDateKey(els.fieldStartDate.value) || todayKey;
    var duration = clampDays(els.fieldDuration.value);
    els.fieldEndDate.value = shiftKey(start, duration - 1);
    updateDateHint();
  }

  function syncChallengeMode() {
    var buttons = document.querySelectorAll('[data-challenge-mode]');
    Array.prototype.forEach.call(buttons, function (btn) {
      var on = btn.dataset.challengeMode === sheetChallengeMode;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    if (els.challengeModeHint) {
      els.challengeModeHint.textContent = sheetChallengeMode === 'build'
        ? 'Each day gets its own slot. Use Day 1, Day 2… headers or a blank line.'
        : 'A recurring checklist for every day of the window.';
    }
  }

  function applySheetMode() {
    var isTask = sheetMode === 'task';
    var isChallenge = sheetMode === 'challenge';

    els.taskExtras.hidden = !isTask;
    els.trackExtras.hidden = !isChallenge && sheetMode !== 'program';
    els.trackDates.hidden = !isChallenge;
    els.challengeModeField.hidden = !isChallenge;

    if (isTask) {
      els.sheetTitle.textContent = editingId ? 'Edit task' : (newRecurring ? 'New non-negotiable' : 'New task');
      els.labelTitle.textContent = 'Task';
      els.labelWhy.textContent = 'Why it matters';
      els.fieldTitle.placeholder = 'What are you doing?';
      els.fieldWhy.placeholder = 'Where does this take you?';
      return;
    }

    if (isChallenge) syncChallengeMode();

    els.sheetTitle.textContent = editingId
      ? (isChallenge ? 'Edit challenge' : 'Edit program')
      : (isChallenge ? 'New challenge' : 'New program');
    els.labelTitle.textContent = isChallenge ? 'Challenge name' : 'Program name';
    els.labelWhy.textContent = 'Why it takes you forward';
    els.fieldTitle.placeholder = isChallenge ? 'e.g. 7-Day No Sugar' : 'e.g. Morning Protocol';
    els.fieldWhy.placeholder = 'What does finishing this change?';
    els.labelItems.innerHTML = isChallenge
      ? (sheetChallengeMode === 'build'
        ? 'Day plan <span class="optional">Day 1, Day 2… or blank lines</span>'
        : 'Daily checklist <span class="optional">one per line</span>')
      : 'Routine items <span class="optional">one per line</span>';
    els.fieldItems.placeholder = isChallenge
      ? (sheetChallengeMode === 'build'
        ? 'Day 1\nSet up\nRead 20 pages\n\nDay 2\nDraft'
        : 'No added sugar\n2L water\n20 minute walk')
      : 'Wake at 06:00\n10 min sunlight\nCold shower';
  }

  function openTaskSheet(task, recurringPreset) {
    if (task && task.programId) return;
    sheetMode = 'task';
    editingId = task ? task.id : null;
    newRecurring = !!recurringPreset;

    els.fieldTitle.value = task ? task.title : '';
    els.fieldWhy.value = task ? task.why : '';
    els.fieldTime.value = task ? task.time : '';
    els.fieldRecurring.checked = task ? !!task.recurring : newRecurring;
    els.sheetDelete.hidden = !task;
    clearError();
    applySheetMode();
    showSheet();
  }

  /* A build plan is stored per day slot, but editing must show the exact text
     that was written. Keep the original text when the challenge has one; a
     rebuilt plan gets an explicit Day header for every slot so no milestone
     can drift onto another date. */
  function buildPlanText(ch) {
    if (typeof ch.planText === 'string' && ch.planText.trim()) {
      return ch.planText.replace(/\r\n?/g, '\n');
    }
    return (ch.plan || []).map(function (slot, index) {
      var lines = (slot.items || []).map(function (entry) { return entry.title; });
      return 'Day ' + (index + 1) + '\n' + lines.join('\n');
    }).join('\n\n');
  }

  function openTrackSheet(mode, item) {
    sheetMode = mode;
    editingId = item ? item.id : null;
    sheetChallengeMode = item && mode === 'challenge' && item.mode === 'build' ? 'build' : 'habit';

    els.fieldTitle.value = item ? item.title : '';
    els.fieldWhy.value = item ? item.why : '';
    if (item && mode === 'challenge') {
      if (sheetChallengeMode === 'build' && Array.isArray(item.plan)) {
        els.fieldItems.value = buildPlanText(item);
      } else {
        els.fieldItems.value = item.daily.map(function (entry) { return entry.title; }).join('\n');
      }
    } else if (item && mode === 'program') {
      els.fieldItems.value = item.items.join('\n');
    } else {
      els.fieldItems.value = '';
    }

    var duration = item ? item.duration : (mode === 'challenge' ? 7 : 21);
    els.fieldDuration.value = String(duration);

    if (mode === 'challenge') {
      var start = item && item.startDate ? item.startDate : todayKey;
      var end = item && item.endDate ? item.endDate : shiftKey(start, duration - 1);
      els.fieldStartDate.value = start;
      els.fieldEndDate.value = end;
      updateDateHint();
    }

    els.sheetDelete.hidden = true;
    clearError();
    applySheetMode();
    showSheet();
  }

  function showSheet() {
    els.sheet.hidden = false;
    document.body.classList.add('sheet-open');

    var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (finePointer) {
      window.setTimeout(function () {
        if (!els.sheet.hidden) els.fieldTitle.focus();
      }, 60);
    }
  }

  function closeSheet() {
    els.sheet.hidden = true;
    document.body.classList.remove('sheet-open');
    editingId = null;
    sheetMode = 'task';
  }

  function saveTask() {
    var wasEditing = !!editingId;
    var title = trimText(els.fieldTitle.value, MAX_TITLE);
    if (!title) {
      showError('Give the task a name first.');
      els.fieldTitle.focus();
      return;
    }

    var data = {
      title: title,
      why: trimText(els.fieldWhy.value, MAX_WHY),
      time: normalizeTime(els.fieldTime.value),
      recurring: els.fieldRecurring.checked
    };

    /* A new task lands on the exact day being viewed, so a past day can be
       filled in later. Only non-negotiables recur beyond it. */
    var targetKey = selectedKey;

    if (editingId) {
      state.tasks.forEach(function (task) {
        if (task.id !== editingId) return;
        task.title = data.title;
        task.why = data.why;
        task.time = data.time;
        task.recurring = data.recurring;
        if (data.recurring) task.date = '';
        else if (!task.date) task.date = targetKey;
      });
      /* Every day but today renders its own sealed snapshot, so an edit made
         on a viewed day has to land in that day's copy too — including a
         frozen card whose task no longer exists in the live list. */
      if (targetKey !== todayKey) {
        var editRecord = state.days[targetKey];
        if (editRecord && Array.isArray(editRecord.items)) {
          editRecord.items.forEach(function (item) {
            if (item.id !== editingId) return;
            item.title = data.title;
            item.why = data.why;
            item.time = data.time;
            item.recurring = data.recurring;
          });
        }
      }
    } else {
      var created = {
        id: uid(),
        title: data.title,
        why: data.why,
        time: data.time,
        recurring: data.recurring,
        date: data.recurring ? '' : targetKey,
        key: streakKeyFor(data.title),
        createdAt: Date.now()
      };
      state.tasks.unshift(created);
      /* A past day renders from its own frozen record, so a task added there
         has to join that record directly. */
      if (targetKey !== todayKey) {
        var record = state.days[targetKey];
        if (!record) record = state.days[targetKey] = { items: [], done: [] };
        if (!Array.isArray(record.items)) record.items = [];
        record.items.unshift(frozenTask(created));
      }
    }

    save();
    closeSheet();
    renderAll();
    toast(wasEditing
      ? 'Task updated'
      : targetKey === todayKey
        ? 'Task added'
        : '✓ Task added to ' + fromKey(targetKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
  }

  /* Build mode accepts either explicit `Day 1` / `Day 1:` headers or a blank
     line between days. Each block maps to its own numbered slot, so a
     milestone can never drift onto the wrong date. */
  function readBuildBlocks(text) {
    var lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
    var blocks = [];
    var current = null;
    var sawHeader = false;

    lines.forEach(function (line) {
      var trimmed = line.trim();
      /* "Day 1 milestone" stays an item; only a bare header or a header with
         an explicit separator starts a new day. */
      var header = /^day\s*(\d+)\s*(?:[:.\-–—·]\s*(.*))?$/i.exec(trimmed);
      if (header) {
        sawHeader = true;
        current = { day: parseInt(header[1], 10), items: [] };
        blocks.push(current);
        if (header[2] && header[2].trim()) current.items.push(header[2].trim());
        return;
      }
      if (!trimmed) {
        if (!sawHeader) current = null;
        return;
      }
      if (!current) {
        current = { day: blocks.length + 1, items: [] };
        blocks.push(current);
      }
      current.items.push(trimmed);
    });

    return { blocks: blocks, headers: sawHeader };
  }

  function parseBuildPlan(text, duration, existing) {
    var parsed = readBuildBlocks(text);
    var slots = [];
    var i;
    for (i = 0; i < duration; i += 1) slots.push([]);

    if (parsed.headers) {
      /* Explicit day numbers win, even when the blocks arrive out of order. */
      parsed.blocks.forEach(function (block) {
        var index = block.day - 1;
        if (index < 0 || index >= duration) return;
        slots[index] = slots[index].concat(block.items);
      });
    } else {
      parsed.blocks.forEach(function (block, index) {
        if (index < duration) slots[index] = block.items;
      });
    }

    var oldPlan = existing && existing.mode === 'build' && Array.isArray(existing.plan)
      ? existing.plan
      : [];
    var used = {};
    var plan = [];

    for (i = 0; i < duration; i += 1) {
      var seen = {};
      var lines = slots[i].map(function (line) {
        return trimText(line, MAX_TITLE);
      }).filter(function (line) {
        var key = line.toLowerCase();
        if (!line || seen[key]) return false;
        seen[key] = true;
        return true;
      }).slice(0, MAX_ITEMS);
      if (!lines.length) lines = ['Day ' + (i + 1) + ' milestone'];

      var oldById = {};
      var oldItems = oldPlan[i] && Array.isArray(oldPlan[i].items) ? oldPlan[i].items : [];
      oldItems.forEach(function (entry) {
        oldById[entry.title.toLowerCase()] = entry.id;
      });

      var dayItems = lines.map(function (line) {
        var id = oldById[line.toLowerCase()] || uid();
        if (used[id]) id = uid();
        used[id] = true;
        return { id: id, title: line };
      });
      plan.push({ items: dayItems });
    }
    return plan;
  }

  function saveTrack() {
    var mode = sheetMode;
    var wasEditing = !!editingId;
    var title = trimText(els.fieldTitle.value, MAX_TITLE);
    if (!title) {
      showError('Give it a name first.');
      els.fieldTitle.focus();
      return;
    }

    var duration = clampDays(els.fieldDuration.value);
    var items = els.fieldItems.value.split('\n').map(function (line) {
      return trimText(line, MAX_TITLE);
    }).filter(Boolean).slice(0, MAX_ITEMS);
    var why = trimText(els.fieldWhy.value, MAX_WHY);

    if (mode === 'challenge') {
      var modeValue = sheetChallengeMode === 'build' ? 'build' : 'habit';
      if (modeValue === 'habit' && !items.length) {
        showError('Add at least one daily action.');
        els.fieldItems.focus();
        return;
      }

      var startDate = validDateKey(els.fieldStartDate.value) || todayKey;
      var endDate = validDateKey(els.fieldEndDate.value) ||
        shiftKey(startDate, duration - 1);
      if (endDate <= startDate) {
        showError('End date must be after the start date.');
        els.fieldEndDate.focus();
        return;
      }
      duration = clampDays(daysBetween(startDate, endDate) + 1);
      endDate = shiftKey(startDate, duration - 1);

      var existing = editingId
        ? state.challenges.filter(function (ch) { return ch.id === editingId; })[0]
        : null;
      var daily = [];
      var plan = [];

      if (modeValue === 'habit') {
        var oldIds = {};
        if (existing) {
          existing.daily.forEach(function (entry) {
            oldIds[entry.title.toLowerCase()] = entry.id;
          });
        }
        var used = {};
        daily = items.map(function (text) {
          var id = oldIds[text.toLowerCase()] || uid();
          if (used[id]) id = uid();
          used[id] = true;
          return { id: id, title: text };
        });
      } else {
        plan = parseBuildPlan(els.fieldItems.value, duration, existing);
      }

      /* Keep the raw day plan exactly as written, so opening it again shows
         the same Day headers and line breaks the user typed. */
      var planText = modeValue === 'build'
        ? els.fieldItems.value.replace(/\r\n?/g, '\n')
        : '';

      if (existing) {
        existing.title = title;
        existing.why = why;
        existing.mode = modeValue;
        existing.duration = duration;
        existing.startDate = startDate;
        existing.endDate = endDate;
        existing.daily = daily;
        existing.plan = plan;
        existing.planText = planText;
        /* Configuring the beginning moves the day count with it. */
        if (existing.startedAt) existing.startedAt = startDate;
      } else {
        state.challenges.unshift({
          id: uid(),
          title: title,
          why: why,
          mode: modeValue,
          duration: duration,
          startDate: startDate,
          endDate: endDate,
          daily: daily,
          plan: plan,
          planText: planText,
          startedAt: null,
          log: {}
        });
      }
    } else {
      if (!items.length) {
        showError('Add at least one routine item.');
        els.fieldItems.focus();
        return;
      }
      var existingProgram = editingId
        ? state.programs.filter(function (p) { return p.id === editingId; })[0]
        : null;
      if (existingProgram) {
        existingProgram.title = title;
        existingProgram.why = why;
        existingProgram.duration = duration;
        existingProgram.items = items;
      } else {
        state.programs.unshift({
          id: uid(),
          title: title,
          why: why,
          duration: duration,
          items: items,
          startedAt: null
        });
      }
    }

    save();
    closeSheet();
    renderAll();
    toast(wasEditing
      ? (mode === 'challenge' ? 'Challenge updated' : 'Program updated')
      : (mode === 'challenge' ? 'Challenge added' : 'Program added'));
  }

  function saveSheet(event) {
    event.preventDefault();
    if (sheetMode === 'task') saveTask();
    else saveTrack();
  }

  /* ------------------------- hold-to-confirm delete ----------------------- */

  /* Deleting is permanent, so every × opens this dialog instead of firing at
     once: the action only runs after a deliberate press-and-hold. Releasing
     early cancels, and the fill shows how much of the hold is left. */

  var CONFIRM_HOLD_MS = 900;
  var confirmCallback = null;
  var confirmOpener = null;
  var confirmStartAt = 0;
  var confirmRaf = 0;
  var confirmDone = false;

  var CONFIRM_COPY = {
    task: {
      title: 'Delete this task?',
      note: 'It leaves the day you delete it on; other days keep their own record.'
    },
    habit: {
      title: 'Delete this non-negotiable?',
      note: 'It leaves that day’s list; other days keep their own ticks.'
    },
    challenge: {
      title: 'Delete this challenge?',
      note: 'Every logged win goes with it.'
    },
    program: {
      title: 'Delete this program?',
      note: 'Its routine items are removed from your list with it.'
    },
    workout: {
      title: 'Delete this workout?',
      note: 'Its exercise history and session logs go with it.'
    }
  };

  function askDelete(kind, title, onConfirm) {
    var copy = CONFIRM_COPY[kind] || CONFIRM_COPY.task;
    confirmCallback = onConfirm;
    confirmOpener = document.activeElement;
    if (confirmOpener && typeof confirmOpener.blur === 'function') confirmOpener.blur();
    els.confirmTitle.textContent = copy.title;
    els.confirmItem.textContent = title || '';
    els.confirmNote.textContent = copy.note;
    resetConfirmHold();
    confirmDone = false;
    els.confirm.hidden = false;
    document.body.classList.add('confirm-open');
    window.setTimeout(function () {
      if (!els.confirm.hidden) els.confirmHold.focus();
    }, 40);
  }

  function closeConfirm(restoreFocus) {
    resetConfirmHold();
    confirmCallback = null;
    els.confirm.hidden = true;
    document.body.classList.remove('confirm-open');
    var opener = confirmOpener;
    confirmOpener = null;
    if (!restoreFocus || !opener) return;
    if (!document.contains(opener) || opener.offsetParent === null) return;
    try { opener.focus({ preventScroll: true }); } catch (err) { /* ignore */ }
  }

  function resetConfirmHold() {
    if (confirmRaf) {
      window.cancelAnimationFrame(confirmRaf);
      confirmRaf = 0;
    }
    confirmStartAt = 0;
    els.confirmHold.classList.remove('is-holding');
    els.confirmHold.style.setProperty('--hold', '0');
    els.confirmHoldText.textContent = 'Hold to delete';
  }

  function startConfirmHold(event) {
    if (event) event.preventDefault();
    if (els.confirm.hidden || confirmRaf || confirmDone) return;
    confirmStartAt = 0;
    els.confirmHold.classList.add('is-holding');
    els.confirmHoldText.textContent = 'Keep holding…';
    vibrate(6);
    confirmRaf = window.requestAnimationFrame(stepConfirmHold);
  }

  function stepConfirmHold(now) {
    confirmRaf = 0;
    if (!confirmStartAt) confirmStartAt = now;
    var ratio = Math.min(1, (now - confirmStartAt) / CONFIRM_HOLD_MS);
    els.confirmHold.style.setProperty('--hold', ratio.toFixed(4));
    if (ratio >= 1) {
      finishConfirmHold();
      return;
    }
    confirmRaf = window.requestAnimationFrame(stepConfirmHold);
  }

  function finishConfirmHold() {
    if (confirmDone) return;
    confirmDone = true;
    if (confirmRaf) {
      window.cancelAnimationFrame(confirmRaf);
      confirmRaf = 0;
    }
    els.confirmHold.style.setProperty('--hold', '1');
    els.confirmHold.classList.remove('is-holding');
    vibrate(18);
    var run = confirmCallback;
    closeConfirm(false);
    if (run) run();
  }

  /* Remove a task on the day it is deleted on without rewriting the rest of
     history: other days keep the copy and ticks they were lived with. */
  function purgeTasks(ids, key) {
    if (!ids.length) return;
    state.tasks = state.tasks.filter(function (t) { return ids.indexOf(t.id) === -1; });
    var record = state.days[key || todayKey];
    if (!record) return;
    record.items = (record.items || []).filter(function (item) {
      return ids.indexOf(item.id) === -1;
    });
    record.done = (record.done || []).filter(function (id) {
      return ids.indexOf(id) === -1;
    });
  }

  function removeTask(id, key) {
    purgeTasks([id], key);
    save();
    renderAll();
    toast('✓ Task deleted');
  }

  /* A day card can outlive the live task it came from, so the sheet needs to
     read the frozen copy when the task itself is already gone. */
  function dayItemById(id, key) {
    var record = state.days[key];
    var items = record && Array.isArray(record.items) ? record.items : [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return items[i];
    }
    return null;
  }

  function removeProgram(p) {
    var ids = state.tasks.filter(function (t) { return t.programId === p.id; })
      .map(function (t) { return t.id; });
    state.programs = state.programs.filter(function (item) { return item.id !== p.id; });
    purgeTasks(ids);
    save();
    renderAll();
    toast('✓ Program deleted' +
      (ids.length ? ' · ' + ids.length + ' linked item' + (ids.length === 1 ? '' : 's') + ' removed' : ''));
  }

  function deleteFromSheet() {
    if (!editingId) return;
    var id = editingId;
    var task = state.tasks.filter(function (t) { return t.id === id; })[0];
    if (task && task.programId) return;
    var frozen = task ? null : dayItemById(id, selectedKey);
    if (!task && !frozen) return;
    var recurring = task ? !!task.recurring : !!frozen.recurring;
    var title = task ? task.title : frozen.title;
    var sheetKey = selectedKey;
    askDelete(recurring ? 'habit' : 'task', title, function () {
      closeSheet();
      removeTask(id, sheetKey);
    });
  }

  /* --------------------------------- toast ------------------------------- */

  /* A leading ✓ is rendered as its own green glyph, so confirmations read as
     a success at a glance rather than as plain status text. */
  function toast(message) {
    if (toastTimer) {
      window.clearTimeout(toastTimer);
      toastTimer = 0;
    }

    var text = String(message == null ? '' : message);
    var success = text.charAt(0) === '✓';
    els.toast.textContent = '';
    els.toast.classList.toggle('is-success', success);

    if (success) {
      var mark = makeEl('span', 'toast-check', '✓');
      mark.setAttribute('aria-hidden', 'true');
      els.toast.appendChild(mark);
      els.toast.appendChild(makeEl('span', 'toast-msg', text.slice(1).trim()));
    } else {
      els.toast.textContent = text;
    }

    els.toast.hidden = false;
    toastTimer = window.setTimeout(function () {
      els.toast.hidden = true;
      toastTimer = 0;
    }, 2400);
  }

  /* -------------------------------- events ------------------------------- */

  els.addBtn.addEventListener('click', function () { openTaskSheet(null, false); });
  els.addHabitBtn.addEventListener('click', function () { openTaskSheet(null, true); });
  els.addChallengeBtn.addEventListener('click', function () { openTrackSheet('challenge'); });

  Array.prototype.forEach.call(document.querySelectorAll('[data-challenge-mode]'), function (btn) {
    btn.addEventListener('click', function () {
      sheetChallengeMode = btn.dataset.challengeMode === 'build' ? 'build' : 'habit';
      applySheetMode();
    });
  });

  /* Rest days are a deliberate choice, so a single tap toggles the selected
     date. They never score as a win or a loss, and they can only be claimed
     while the day still sits at 0 — no escape hatch once progress starts. */
  if (els.restToggle) {
    els.restToggle.addEventListener('click', function () {
      if (!state.restDays) state.restDays = {};
      if (isRestDay(selectedKey)) {
        delete state.restDays[selectedKey];
        toast('Rest day cleared');
      } else {
        if (dayResult(selectedKey).done > 0) {
          vibrate(14);
          toast('Rest day is locked · progress already started');
          return;
        }
        state.restDays[selectedKey] = true;
        toast('Rest day · streak frozen');
      }
      save();
      renderAll();
    });
  }

  els.calPrev.addEventListener('click', function () {
    calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() - 1, 1);
    renderCalendar();
  });
  els.calNext.addEventListener('click', function () {
    calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() + 1, 1);
    renderCalendar();
  });

  els.studioClose.addEventListener('click', closeStudio);
  els.studioBody.addEventListener('click', onStudioClick);
  els.studioBody.addEventListener('input', onStudioInput);
  els.studioBody.addEventListener('change', onStudioChange);
  els.studioFoot.addEventListener('click', onStudioClick);

  els.editBtn.addEventListener('click', function () {
    editMode = !editMode;
    renderAll();
    if (editMode) toast('Tap × to delete, or a task to edit');
  });

  els.editChallenges.addEventListener('click', function () {
    manageChallenges = !manageChallenges;
    renderChallenges();
    els.editChallenges.classList.toggle('is-on', manageChallenges);
    els.editChallenges.setAttribute('aria-pressed', manageChallenges ? 'true' : 'false');
  });

  /* Any exercise name can open the animated guide, from the page or the studio. */
  document.addEventListener('click', function (event) {
    var trigger = event.target.closest ? event.target.closest('[data-demo]') : null;
    if (!trigger) return;
    event.preventDefault();
    openDemo(trigger.dataset.demo);
  });

  els.demoClose.addEventListener('click', closeDemo);
  els.demoVeil.addEventListener('click', closeDemo);

  Array.prototype.forEach.call(els.tabbar.querySelectorAll('.tab'), function (tab) {
    tab.addEventListener('click', function () {
      setView(tab.dataset.view);
    });
  });

  els.taskForm.addEventListener('submit', saveSheet);
  els.sheetDelete.addEventListener('click', deleteFromSheet);
  els.sheetClose.addEventListener('click', closeSheet);
  els.sheetCancel.addEventListener('click', closeSheet);
  els.sheetVeil.addEventListener('click', closeSheet);

  els.confirmCancel.addEventListener('click', function () { closeConfirm(true); });
  els.confirmVeil.addEventListener('click', function () { closeConfirm(true); });

  els.confirmHold.addEventListener('pointerdown', startConfirmHold);
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (type) {
    els.confirmHold.addEventListener(type, function () {
      if (!confirmDone) resetConfirmHold();
    });
  });
  els.confirmHold.addEventListener('contextmenu', function (event) {
    event.preventDefault();
  });
  els.confirmHold.addEventListener('keydown', function (event) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (event.repeat) {
      event.preventDefault();
      return;
    }
    startConfirmHold(event);
  });
  els.confirmHold.addEventListener('keyup', function (event) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    if (!confirmDone) resetConfirmHold();
  });

  els.fieldTitle.addEventListener('input', function () {
    if (!els.fieldTitle.value.trim()) return;
    clearError();
  });

  els.fieldStartDate.addEventListener('change', syncDatesFromStart);
  els.fieldEndDate.addEventListener('change', syncDurationFromEnd);
  els.fieldDuration.addEventListener('input', function () {
    if (sheetMode === 'challenge') syncEndFromDuration();
  });

  els.focusSwitch.addEventListener('change', function () {
    if (els.focusSwitch.checked) startSuperfocus();
    else stopSuperfocus();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (!els.demo.hidden) closeDemo();
    else if (!els.confirm.hidden) closeConfirm(true);
    else if (!els.studio.hidden) closeStudio();
    else if (!els.sheet.hidden) closeSheet();
    else if (superfocusOn()) stopSuperfocus();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    syncFromStorage();
    rollover();
  });

  /* iOS can restore a standalone page from the back/forward cache. Repaint
     from storage so the day's ticks are never lost on the way back. */
  window.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    resetPull();
    syncFromStorage();
    renderAll();
  });

  /* ------------------------ pull to refresh + veil ------------------------ */

  /* There is no native pull-to-refresh here (overscroll is contained), so this
     replaces the grey sheet with AURA's own: dark glass, indigo/gold glow and a
     gold → violet spinner. Releasing past the trigger reloads the shell. */

  var PULL_MAX = 76;
  var PULL_TRIGGER = 52;
  var PULL_SLIDE = 64;
  var pull = { startY: 0, active: false, armed: false, loading: false };

  function setPull(distance) {
    if (!els.ptr) return;
    var d = Math.max(0, Math.min(PULL_MAX, distance));
    els.ptr.style.setProperty('--ptr', Math.min(d, PULL_SLIDE) + 'px');
    els.ptr.style.setProperty('--ptr-o', (d / PULL_MAX).toFixed(3));
    pull.armed = d >= PULL_TRIGGER;
    els.ptr.classList.toggle('is-armed', pull.armed);
    if (!pull.loading) els.ptrText.textContent = pull.armed ? 'Release to refresh' : 'Pull to refresh';
  }

  function canPull() {
    if (pull.loading || superfocusOn() || !els.sheet.hidden || !els.confirm.hidden ||
      !els.studio.hidden || !els.demo.hidden) return false;
    return (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
  }

  function resetPull() {
    pull.active = false;
    pull.loading = false;
    if (!els.ptr) return;
    els.ptr.classList.remove('is-loading', 'is-armed');
    setPull(0);
  }

  function beginReload() {
    if (!els.ptr) {
      window.location.reload();
      return;
    }
    setPull(PULL_MAX);
    pull.loading = true;
    els.ptr.classList.add('is-loading');
    els.ptrText.textContent = 'Refreshing';
    window.setTimeout(function () {
      window.location.reload();
    }, 420);
  }

  document.addEventListener('touchstart', function (event) {
    if (event.touches.length !== 1 || !canPull()) return;
    pull.startY = event.touches[0].clientY;
    pull.active = true;
  }, { passive: true });

  document.addEventListener('touchmove', function (event) {
    if (!pull.active) return;
    var dy = event.touches[0].clientY - pull.startY;
    if (dy <= 0) {
      setPull(0);
      if (dy < -8) pull.active = false;
      return;
    }
    if (!canPull()) {
      pull.active = false;
      setPull(0);
      return;
    }
    if (event.cancelable) event.preventDefault();
    setPull(dy * 0.55);
  }, { passive: false });

  document.addEventListener('touchend', function () {
    if (!pull.active) return;
    pull.active = false;
    if (pull.armed && !pull.loading) beginReload();
    else if (!pull.loading) setPull(0);
  }, { passive: true });

  document.addEventListener('touchcancel', function () {
    pull.active = false;
    if (!pull.loading) setPull(0);
  }, { passive: true });

  if (els.boot) {
    var dismissBoot = function () { els.boot.classList.add('is-gone'); };
    window.addEventListener('load', dismissBoot);
    window.setTimeout(dismissBoot, 900);
  }

  /* --------------------------------- boot -------------------------------- */

  function rollover() {
    var key = keyOf(new Date());
    if (key === todayKey) return;
    var followingToday = selectedKey === todayKey;
    todayKey = key;
    if (followingToday) selectedKey = key;
    /* A new day has its own tasks, so a running focus session keeps only the
       targets that still exist; anything new is picked by tapping. */
    if (state.focus.active) {
      state.focus.targets = focusTargetsToday();
      if (!focusablesToday().length) state.focus.active = false;
    }
    renderAll();
    /* The new day's snapshot is born empty, so every routine starts fresh. */
    save();
  }

  window.setInterval(rollover, 60000);

  /* iOS ignores user-scalable=no, so also close the gesture gaps. */
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (type) {
    document.addEventListener(type, function (event) {
      event.preventDefault();
    }, { passive: false });
  });

  document.addEventListener('touchmove', function (event) {
    if (event.touches.length > 1) event.preventDefault();
  }, { passive: false });

  document.addEventListener('dblclick', function (event) {
    event.preventDefault();
  }, { passive: false });

  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {
        /* Registration is optional; the app runs without it. */
      });
    });
  }

  ensureProgramLinks();
  /* A saved session may point at yesterday's one-day tasks; re-target it to
     today's work before the first paint. */
  if (state.focus.active) {
    state.focus.targets = focusTargetsToday();
    if (!focusablesToday().length) state.focus.active = false;
  }
  renderAll();
  save();
})();
