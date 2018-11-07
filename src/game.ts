const camera = Camera.instance

enum Goal
{
  Idle,
  Sit,
  Follow,
  GoDrink,
  Drinking,
}

////////////////////////
// Custom components

@Component('behavior')
export class Behavior { 
    goal: Goal = Goal.Idle
    previousGoal: Goal = Goal.Idle
    animationWeight: number = 1
    timer: number = 100
}

@Component('walkTarget')
export class WalkTarget { 
    target: Vector3 = Vector3.Zero()
    previousPos: Vector3 = Vector3.Zero()
    fraction: number = 0
}

///////////////////////////
// Entity groups

const dogs = engine.getComponentGroup(Transform, Behavior, WalkTarget)


///////////////////////////
// Systems


export class SwitchGoals {
  update(dt: number) {
    for (let dog of dogs.entities) {
      let transform = dog.get(Transform)
      let behavior = dog.get(Behavior)
      let walkTarget = dog.get(WalkTarget)
      behavior.animationWeight += 0.01
      behavior.timer -= 1
      if (behavior.timer < 0 ){
        behavior.timer = 60
        switch(behavior.goal){
          case Goal.Idle:
            considerGoals([
              {goal: Goal.Sit, odds: .1},
              {goal: Goal.Follow, odds: .9},
            ])
            break
          case Goal.Drinking:
            considerGoals([
              {goal: Goal.Sit, odds: .1},
            ])
            break
          case Goal.Follow:
            considerGoals([
              {goal: Goal.Idle, odds: .1},
            ])
            break
          case Goal.GoDrink:
          break
          case Goal.Sit:
            considerGoals([
              {goal: Goal.Idle, odds: .1},
            ])
            break
        } 
      

        switch(behavior.goal)
        {
          case Goal.Follow:
            if(!isInBounds(camera.position)) {
              setDogGoal(Goal.Idle)
            }
            else{
              walkTarget.target = camera.position
              walkTarget.previousPos = transform.position
              walkTarget.fraction = 0
            }
            break
          case Goal.GoDrink:
            walkTarget.target = bowl.get(Transform).position
            walkTarget.previousPos = transform.position
            walkTarget.fraction = 0
            break
        }
      }
    }
  }
}

export class walk {
  update(dt: number) {
    for (let dog of dogs.entities) {
      let transform = dog.get(Transform)
      let walk = dog.get(WalkTarget)
      if (walk.fraction < 1){
        transform.position = Vector3.Lerp(walk.previousPos, walk.target, walk.fraction)
        walk.fraction += 1/60
  
      }
    }
  }
}


engine.addSystem(new SwitchGoals())
engine.addSystem(new walk())

///////////////////////////
// INITIAL ENTITIES


// Bowl
const bowl = new Entity()
bowl.set(new GLTFShape("models/BlockDogBowl.gltf"))
bowl.set(new Transform())
bowl.get(Transform).position.set(9, 0, 1)
bowl.set(new OnClick( _ => {
    setDogGoal(Goal.Drinking)
    dog.get(Behavior).timer = 0
}))
engine.addEntity(bowl)

// Garden
const garden = new Entity()
garden.set(new GLTFShape("models/garden.gltf"))
garden.set(new Transform())
garden.get(Transform).position.set(5, 0, 5)
engine.addEntity(garden)


// Dog
const dog = new Entity()
dog.set(new GLTFShape("models/BlockDog.gltf"))
dog.set(new Transform())
dog.get(Transform).position.set(5, 0, 5)
dog.set(new Behavior())
dog.set(new WalkTarget())
dog.set(new OnClick( _ => {
  if (dog.get(Behavior).goal == Goal.Sit)
  {
    setDogGoal(Goal.Idle)
  }
  else {
    setDogGoal(Goal.Sit)
  }
  dog.get(Behavior).timer = 0
}))
engine.addEntity(dog)


////////////////////////
//OTHER FUNCTIONS


function isInBounds(position: Vector3): boolean
{
  return position.x > .5 && position.x < 9.5
    && position.z > .5 && position.z < 9.5;
}

function setDogGoal(goal: Goal){
  let behavior = dog.get(Behavior)
  behavior.previousGoal = behavior.goal  //is this a reference?
  behavior.goal = goal
  behavior.animationWeight = 1 - behavior.animationWeight
  log("new goal: " + goal)
}



function considerGoals(goals: {goal: Goal, odds: number}[]) {
  for(let i = 0; i < goals.length; i++)
  {
    if(Math.random() < goals[i].odds)
    {
      switch(goals[i].goal)
      {
        case Goal.Follow:
          if(!isInBounds(camera.position))
          {
            continue;
          }
      }

      setDogGoal(goals[i].goal);
      return;
    }
  }
}



// function getAnimationRates() : {idle: number, sit: number, walk: number} {
//   const weight = Math.min(Math.max(dog.get(Behavior).animationWeight, 0), 1);
//   const inverse = 1 - weight;

//   let sit = 0;
//   let walk = 0;
  
//   switch(dog.get(Behavior).previousGoal){
//     case Goal.Sit:
//       sit = inverse;
//       break;
//     case Goal.Follow:
//     case Goal.GoDrink:
//       walk = inverse;
//       break;
//   }

//   switch(dog.get(Behavior).goal){
//     case Goal.Sit:
//       sit = weight;
//       break;
//     case Goal.Follow:
//     case Goal.GoDrink:
//       walk = weight;
//       break;
//   }

//   return {idle: 1 - (sit + walk), sit, walk};
// }