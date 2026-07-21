"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// core-entry.ts
var core_entry_exports = {};
__export(core_entry_exports, {
  AcceptIdeaCommand: () => AcceptIdeaCommand,
  AcquireCompetitorCommand: () => AcquireCompetitorCommand,
  AcquireDataCommand: () => AcquireDataCommand,
  AcquireSmallCompanyCommand: () => AcquireSmallCompanyCommand,
  AddNodeToClusterCommand: () => AddNodeToClusterCommand,
  AddResourceCommand: () => AddResourceCommand,
  AdjustSalaryCommand: () => AdjustSalaryCommand,
  AdoptOpenSourceCommand: () => AdoptOpenSourceCommand,
  AllocateNormalStaffCommand: () => AllocateNormalStaffCommand,
  AppointDepartmentHeadCommand: () => AppointDepartmentHeadCommand,
  AppointExecutiveCommand: () => AppointExecutiveCommand,
  AssaultKeyPersonnelCommand: () => AssaultKeyPersonnelCommand,
  AssignEmployeeCommand: () => AssignEmployeeCommand,
  BuildDataCenterCommand: () => BuildDataCenterCommand,
  BuildPowerPlantCommand: () => BuildPowerPlantCommand,
  BuyGridPowerCommand: () => BuyGridPowerCommand,
  BuyServerNodeCommand: () => BuyServerNodeCommand,
  BuybackStockCommand: () => BuybackStockCommand,
  CancelResearchProjectCommand: () => CancelResearchProjectCommand,
  CancelStaffTrainingCommand: () => CancelStaffTrainingCommand,
  CancelTrainingCommand: () => CancelTrainingCommand,
  CleanupCandidatesCommand: () => CleanupCandidatesCommand,
  ClearExperimentQueueCommand: () => ClearExperimentQueueCommand,
  CollectionSystem: () => CollectionSystem,
  CompetitorSystem: () => CompetitorSystem,
  ComputeHardwareSystem: () => ComputeHardwareSystem,
  ConductAuditCommand: () => ConductAuditCommand,
  CreateClusterCommand: () => CreateClusterCommand,
  CreateDatasetCommand: () => CreateDatasetCommand,
  CurateDatasetCommand: () => CurateDatasetCommand,
  DEPARTMENT_NAMES: () => DEPARTMENT_NAMES,
  DEPARTMENT_ROLE_MAP: () => DEPARTMENT_ROLE_MAP,
  DedupDatasetCommand: () => DedupDatasetCommand,
  DeleteDatasetCommand: () => DeleteDatasetCommand,
  DismissExecutiveCommand: () => DismissExecutiveCommand,
  DistillCompetitorCommand: () => DistillCompetitorCommand,
  EXTERNAL_CORPS: () => EXTERNAL_CORPS,
  EnterRegionCommand: () => EnterRegionCommand,
  EventBus: () => EventBus,
  FireEmployeeCommand: () => FireEmployeeCommand,
  Game: () => Game,
  GameState: () => GameState,
  GiveBonusCommand: () => GiveBonusCommand,
  GrantEquityCommand: () => GrantEquityCommand,
  HackParametersCommand: () => HackParametersCommand,
  HireCandidateCommand: () => HireCandidateCommand,
  HireEmployeeCommand: () => HireEmployeeCommand,
  HireNormalEmployeeCommand: () => HireNormalEmployeeCommand,
  HireNormalEmployeesBatchCommand: () => HireNormalEmployeesBatchCommand,
  INITIAL_RESOURCES: () => INITIAL_RESOURCES,
  IdeaGenerationSystem: () => IdeaGenerationSystem,
  InfiltrateCorpCommand: () => InfiltrateCorpCommand,
  InfraMaintenanceSystem: () => InfraMaintenanceSystem,
  InfrastructureFailureSystem: () => InfrastructureFailureSystem,
  InstallCardCommand: () => InstallCardCommand,
  IssueSecondaryOfferingCommand: () => IssueSecondaryOfferingCommand,
  LearnSkillCommand: () => LearnSkillCommand,
  MaintainDataCenterCommand: () => MaintainDataCenterCommand,
  MaintainNodeCommand: () => MaintainNodeCommand,
  MoveClusterCommand: () => MoveClusterCommand,
  OperationsSystem: () => OperationsSystem,
  PoachTalentCommand: () => PoachTalentCommand,
  PolishTechCommand: () => PolishTechCommand,
  PostTrainingSystem: () => PostTrainingSystem,
  PowerSystem: () => PowerSystem,
  PromoteEmployeeCommand: () => PromoteEmployeeCommand,
  PublicApologyCommand: () => PublicApologyCommand,
  PublishInRegionCommand: () => PublishInRegionCommand,
  PublishModelCommand: () => PublishModelCommand,
  PurchaseHardwareCommand: () => PurchaseHardwareCommand,
  PurgeDatasetCommand: () => PurgeDatasetCommand,
  QueueExperimentCommand: () => QueueExperimentCommand,
  RaiseFundingCommand: () => RaiseFundingCommand,
  ReallocateTrainingCardsCommand: () => ReallocateTrainingCardsCommand,
  RegionSystem: () => RegionSystem,
  RejectCandidateCommand: () => RejectCandidateCommand,
  RejectIdeaCommand: () => RejectIdeaCommand,
  RemoveQueuedExperimentCommand: () => RemoveQueuedExperimentCommand,
  RentCloudComputeCommand: () => RentCloudComputeCommand,
  RepairCardCommand: () => RepairCardCommand,
  RepairNodeCommand: () => RepairNodeCommand,
  RequestRecruitmentCommand: () => RequestRecruitmentCommand,
  ResearchSystem: () => ResearchSystem,
  ResourceRegistry: () => ResourceRegistry,
  RespondToMissionCommand: () => RespondToMissionCommand,
  ResumeTrainingCommand: () => ResumeTrainingCommand,
  RiskSystem: () => RiskSystem,
  ScrapCardCommand: () => ScrapCardCommand,
  SetDowngradeLevelCommand: () => SetDowngradeLevelCommand,
  SetHeadquartersCommand: () => SetHeadquartersCommand,
  SetModelResearchUsageCommand: () => SetModelResearchUsageCommand,
  SetParallelStrategyCommand: () => SetParallelStrategyCommand,
  SetTokenPricingCommand: () => SetTokenPricingCommand,
  SettleLawsuitCommand: () => SettleLawsuitCommand,
  SmallCompanyMarketSystem: () => SmallCompanyMarketSystem,
  StaffSystem: () => StaffSystem,
  StartDataCollectionCommand: () => StartDataCollectionCommand,
  StartExperimentCommand: () => StartExperimentCommand,
  StartStaffTrainingCommand: () => StartStaffTrainingCommand,
  StartTrainingCommand: () => StartTrainingCommand,
  StopDataCollectionCommand: () => StopDataCollectionCommand,
  SwitchManagementModeCommand: () => SwitchManagementModeCommand,
  SynthesizeDataCommand: () => SynthesizeDataCommand,
  TeamBuildingCommand: () => TeamBuildingCommand,
  TechResearchSystem: () => TechResearchSystem,
  ToggleSkipSafetyCommand: () => ToggleSkipSafetyCommand,
  ToggleStealUserDataCommand: () => ToggleStealUserDataCommand,
  TrainingSystem: () => TrainingSystem,
  TransferDepartmentCommand: () => TransferDepartmentCommand,
  UninstallCardCommand: () => UninstallCardCommand,
  UniqueTechMaintenanceSystem: () => UniqueTechMaintenanceSystem,
  UnpublishModelCommand: () => UnpublishModelCommand,
  UpgradeClusterStorageCommand: () => UpgradeClusterStorageCommand,
  UpgradeNodeInterconnectCommand: () => UpgradeNodeInterconnectCommand,
  UseModelInResearchCommand: () => UseModelInResearchCommand,
  allocateCardsFromCluster: () => allocateCardsFromCluster,
  createDefaultOperations: () => createDefaultOperations,
  createInitialDataset: () => createInitialDataset
});
module.exports = __toCommonJS(core_entry_exports);

// ../../src/core/EventBus.ts
var EventBus = class {
  handlers = /* @__PURE__ */ new Map();
  /** 订阅指定事件，返回的 handler 可用于 off 取消订阅 */
  on(event, handler) {
    let set2 = this.handlers.get(event);
    if (!set2) {
      set2 = /* @__PURE__ */ new Set();
      this.handlers.set(event, set2);
    }
    set2.add(handler);
  }
  /** 取消订阅指定事件处理器 */
  off(event, handler) {
    const set2 = this.handlers.get(event);
    if (!set2) return;
    set2.delete(handler);
    if (set2.size === 0) {
      this.handlers.delete(event);
    }
  }
  /** 触发指定事件，所有订阅器按注册顺序被调用 */
  emit(event, ...args) {
    const set2 = this.handlers.get(event);
    if (!set2) return;
    const snapshot = Array.from(set2);
    for (const handler of snapshot) {
      try {
        handler(...args);
      } catch (err) {
        console.error(`[EventBus] handler for "${event}" threw:`, err);
      }
    }
  }
  /** 移除某事件的所有监听器，或全部事件（不传参时清空所有） */
  clear(event) {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }
};

// ../../node_modules/.pnpm/immer@10.1.1/node_modules/immer/dist/immer.mjs
var NOTHING = Symbol.for("immer-nothing");
var DRAFTABLE = Symbol.for("immer-draftable");
var DRAFT_STATE = Symbol.for("immer-state");
var errors = process.env.NODE_ENV !== "production" ? [
  // All error codes, starting by 0:
  function(plugin) {
    return `The plugin for '${plugin}' has not been loaded into Immer. To enable the plugin, import and call \`enable${plugin}()\` when initializing your application.`;
  },
  function(thing) {
    return `produce can only be called on things that are draftable: plain objects, arrays, Map, Set or classes that are marked with '[immerable]: true'. Got '${thing}'`;
  },
  "This object has been frozen and should not be mutated",
  function(data) {
    return "Cannot use a proxy that has been revoked. Did you pass an object from inside an immer function to an async process? " + data;
  },
  "An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft.",
  "Immer forbids circular references",
  "The first or second argument to `produce` must be a function",
  "The third argument to `produce` must be a function or undefined",
  "First argument to `createDraft` must be a plain object, an array, or an immerable object",
  "First argument to `finishDraft` must be a draft returned by `createDraft`",
  function(thing) {
    return `'current' expects a draft, got: ${thing}`;
  },
  "Object.defineProperty() cannot be used on an Immer draft",
  "Object.setPrototypeOf() cannot be used on an Immer draft",
  "Immer only supports deleting array indices",
  "Immer only supports setting array indices and the 'length' property",
  function(thing) {
    return `'original' expects a draft, got: ${thing}`;
  }
  // Note: if more errors are added, the errorOffset in Patches.ts should be increased
  // See Patches.ts for additional errors
] : [];
function die(error, ...args) {
  if (process.env.NODE_ENV !== "production") {
    const e = errors[error];
    const msg = typeof e === "function" ? e.apply(null, args) : e;
    throw new Error(`[Immer] ${msg}`);
  }
  throw new Error(
    `[Immer] minified error nr: ${error}. Full error at: https://bit.ly/3cXEKWf`
  );
}
var getPrototypeOf = Object.getPrototypeOf;
function isDraft(value) {
  return !!value && !!value[DRAFT_STATE];
}
function isDraftable(value) {
  if (!value)
    return false;
  return isPlainObject(value) || Array.isArray(value) || !!value[DRAFTABLE] || !!value.constructor?.[DRAFTABLE] || isMap(value) || isSet(value);
}
var objectCtorString = Object.prototype.constructor.toString();
function isPlainObject(value) {
  if (!value || typeof value !== "object")
    return false;
  const proto = getPrototypeOf(value);
  if (proto === null) {
    return true;
  }
  const Ctor = Object.hasOwnProperty.call(proto, "constructor") && proto.constructor;
  if (Ctor === Object)
    return true;
  return typeof Ctor == "function" && Function.toString.call(Ctor) === objectCtorString;
}
function each(obj, iter) {
  if (getArchtype(obj) === 0) {
    Reflect.ownKeys(obj).forEach((key) => {
      iter(key, obj[key], obj);
    });
  } else {
    obj.forEach((entry, index) => iter(index, entry, obj));
  }
}
function getArchtype(thing) {
  const state = thing[DRAFT_STATE];
  return state ? state.type_ : Array.isArray(thing) ? 1 : isMap(thing) ? 2 : isSet(thing) ? 3 : 0;
}
function has(thing, prop) {
  return getArchtype(thing) === 2 ? thing.has(prop) : Object.prototype.hasOwnProperty.call(thing, prop);
}
function set(thing, propOrOldValue, value) {
  const t = getArchtype(thing);
  if (t === 2)
    thing.set(propOrOldValue, value);
  else if (t === 3) {
    thing.add(value);
  } else
    thing[propOrOldValue] = value;
}
function is(x, y) {
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}
function isMap(target) {
  return target instanceof Map;
}
function isSet(target) {
  return target instanceof Set;
}
function latest(state) {
  return state.copy_ || state.base_;
}
function shallowCopy(base, strict) {
  if (isMap(base)) {
    return new Map(base);
  }
  if (isSet(base)) {
    return new Set(base);
  }
  if (Array.isArray(base))
    return Array.prototype.slice.call(base);
  const isPlain = isPlainObject(base);
  if (strict === true || strict === "class_only" && !isPlain) {
    const descriptors = Object.getOwnPropertyDescriptors(base);
    delete descriptors[DRAFT_STATE];
    let keys = Reflect.ownKeys(descriptors);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const desc = descriptors[key];
      if (desc.writable === false) {
        desc.writable = true;
        desc.configurable = true;
      }
      if (desc.get || desc.set)
        descriptors[key] = {
          configurable: true,
          writable: true,
          // could live with !!desc.set as well here...
          enumerable: desc.enumerable,
          value: base[key]
        };
    }
    return Object.create(getPrototypeOf(base), descriptors);
  } else {
    const proto = getPrototypeOf(base);
    if (proto !== null && isPlain) {
      return { ...base };
    }
    const obj = Object.create(proto);
    return Object.assign(obj, base);
  }
}
function freeze(obj, deep = false) {
  if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj))
    return obj;
  if (getArchtype(obj) > 1) {
    obj.set = obj.add = obj.clear = obj.delete = dontMutateFrozenCollections;
  }
  Object.freeze(obj);
  if (deep)
    Object.entries(obj).forEach(([key, value]) => freeze(value, true));
  return obj;
}
function dontMutateFrozenCollections() {
  die(2);
}
function isFrozen(obj) {
  return Object.isFrozen(obj);
}
var plugins = {};
function getPlugin(pluginKey) {
  const plugin = plugins[pluginKey];
  if (!plugin) {
    die(0, pluginKey);
  }
  return plugin;
}
var currentScope;
function getCurrentScope() {
  return currentScope;
}
function createScope(parent_, immer_) {
  return {
    drafts_: [],
    parent_,
    immer_,
    // Whenever the modified draft contains a draft from another scope, we
    // need to prevent auto-freezing so the unowned draft can be finalized.
    canAutoFreeze_: true,
    unfinalizedDrafts_: 0
  };
}
function usePatchesInScope(scope, patchListener) {
  if (patchListener) {
    getPlugin("Patches");
    scope.patches_ = [];
    scope.inversePatches_ = [];
    scope.patchListener_ = patchListener;
  }
}
function revokeScope(scope) {
  leaveScope(scope);
  scope.drafts_.forEach(revokeDraft);
  scope.drafts_ = null;
}
function leaveScope(scope) {
  if (scope === currentScope) {
    currentScope = scope.parent_;
  }
}
function enterScope(immer2) {
  return currentScope = createScope(currentScope, immer2);
}
function revokeDraft(draft) {
  const state = draft[DRAFT_STATE];
  if (state.type_ === 0 || state.type_ === 1)
    state.revoke_();
  else
    state.revoked_ = true;
}
function processResult(result, scope) {
  scope.unfinalizedDrafts_ = scope.drafts_.length;
  const baseDraft = scope.drafts_[0];
  const isReplaced = result !== void 0 && result !== baseDraft;
  if (isReplaced) {
    if (baseDraft[DRAFT_STATE].modified_) {
      revokeScope(scope);
      die(4);
    }
    if (isDraftable(result)) {
      result = finalize(scope, result);
      if (!scope.parent_)
        maybeFreeze(scope, result);
    }
    if (scope.patches_) {
      getPlugin("Patches").generateReplacementPatches_(
        baseDraft[DRAFT_STATE].base_,
        result,
        scope.patches_,
        scope.inversePatches_
      );
    }
  } else {
    result = finalize(scope, baseDraft, []);
  }
  revokeScope(scope);
  if (scope.patches_) {
    scope.patchListener_(scope.patches_, scope.inversePatches_);
  }
  return result !== NOTHING ? result : void 0;
}
function finalize(rootScope, value, path) {
  if (isFrozen(value))
    return value;
  const state = value[DRAFT_STATE];
  if (!state) {
    each(
      value,
      (key, childValue) => finalizeProperty(rootScope, state, value, key, childValue, path)
    );
    return value;
  }
  if (state.scope_ !== rootScope)
    return value;
  if (!state.modified_) {
    maybeFreeze(rootScope, state.base_, true);
    return state.base_;
  }
  if (!state.finalized_) {
    state.finalized_ = true;
    state.scope_.unfinalizedDrafts_--;
    const result = state.copy_;
    let resultEach = result;
    let isSet2 = false;
    if (state.type_ === 3) {
      resultEach = new Set(result);
      result.clear();
      isSet2 = true;
    }
    each(
      resultEach,
      (key, childValue) => finalizeProperty(rootScope, state, result, key, childValue, path, isSet2)
    );
    maybeFreeze(rootScope, result, false);
    if (path && rootScope.patches_) {
      getPlugin("Patches").generatePatches_(
        state,
        path,
        rootScope.patches_,
        rootScope.inversePatches_
      );
    }
  }
  return state.copy_;
}
function finalizeProperty(rootScope, parentState, targetObject, prop, childValue, rootPath, targetIsSet) {
  if (process.env.NODE_ENV !== "production" && childValue === targetObject)
    die(5);
  if (isDraft(childValue)) {
    const path = rootPath && parentState && parentState.type_ !== 3 && // Set objects are atomic since they have no keys.
    !has(parentState.assigned_, prop) ? rootPath.concat(prop) : void 0;
    const res = finalize(rootScope, childValue, path);
    set(targetObject, prop, res);
    if (isDraft(res)) {
      rootScope.canAutoFreeze_ = false;
    } else
      return;
  } else if (targetIsSet) {
    targetObject.add(childValue);
  }
  if (isDraftable(childValue) && !isFrozen(childValue)) {
    if (!rootScope.immer_.autoFreeze_ && rootScope.unfinalizedDrafts_ < 1) {
      return;
    }
    finalize(rootScope, childValue);
    if ((!parentState || !parentState.scope_.parent_) && typeof prop !== "symbol" && Object.prototype.propertyIsEnumerable.call(targetObject, prop))
      maybeFreeze(rootScope, childValue);
  }
}
function maybeFreeze(scope, value, deep = false) {
  if (!scope.parent_ && scope.immer_.autoFreeze_ && scope.canAutoFreeze_) {
    freeze(value, deep);
  }
}
function createProxyProxy(base, parent) {
  const isArray = Array.isArray(base);
  const state = {
    type_: isArray ? 1 : 0,
    // Track which produce call this is associated with.
    scope_: parent ? parent.scope_ : getCurrentScope(),
    // True for both shallow and deep changes.
    modified_: false,
    // Used during finalization.
    finalized_: false,
    // Track which properties have been assigned (true) or deleted (false).
    assigned_: {},
    // The parent draft state.
    parent_: parent,
    // The base state.
    base_: base,
    // The base proxy.
    draft_: null,
    // set below
    // The base copy with any updated values.
    copy_: null,
    // Called by the `produce` function.
    revoke_: null,
    isManual_: false
  };
  let target = state;
  let traps = objectTraps;
  if (isArray) {
    target = [state];
    traps = arrayTraps;
  }
  const { revoke, proxy } = Proxy.revocable(target, traps);
  state.draft_ = proxy;
  state.revoke_ = revoke;
  return proxy;
}
var objectTraps = {
  get(state, prop) {
    if (prop === DRAFT_STATE)
      return state;
    const source = latest(state);
    if (!has(source, prop)) {
      return readPropFromProto(state, source, prop);
    }
    const value = source[prop];
    if (state.finalized_ || !isDraftable(value)) {
      return value;
    }
    if (value === peek(state.base_, prop)) {
      prepareCopy(state);
      return state.copy_[prop] = createProxy(value, state);
    }
    return value;
  },
  has(state, prop) {
    return prop in latest(state);
  },
  ownKeys(state) {
    return Reflect.ownKeys(latest(state));
  },
  set(state, prop, value) {
    const desc = getDescriptorFromProto(latest(state), prop);
    if (desc?.set) {
      desc.set.call(state.draft_, value);
      return true;
    }
    if (!state.modified_) {
      const current2 = peek(latest(state), prop);
      const currentState = current2?.[DRAFT_STATE];
      if (currentState && currentState.base_ === value) {
        state.copy_[prop] = value;
        state.assigned_[prop] = false;
        return true;
      }
      if (is(value, current2) && (value !== void 0 || has(state.base_, prop)))
        return true;
      prepareCopy(state);
      markChanged(state);
    }
    if (state.copy_[prop] === value && // special case: handle new props with value 'undefined'
    (value !== void 0 || prop in state.copy_) || // special case: NaN
    Number.isNaN(value) && Number.isNaN(state.copy_[prop]))
      return true;
    state.copy_[prop] = value;
    state.assigned_[prop] = true;
    return true;
  },
  deleteProperty(state, prop) {
    if (peek(state.base_, prop) !== void 0 || prop in state.base_) {
      state.assigned_[prop] = false;
      prepareCopy(state);
      markChanged(state);
    } else {
      delete state.assigned_[prop];
    }
    if (state.copy_) {
      delete state.copy_[prop];
    }
    return true;
  },
  // Note: We never coerce `desc.value` into an Immer draft, because we can't make
  // the same guarantee in ES5 mode.
  getOwnPropertyDescriptor(state, prop) {
    const owner = latest(state);
    const desc = Reflect.getOwnPropertyDescriptor(owner, prop);
    if (!desc)
      return desc;
    return {
      writable: true,
      configurable: state.type_ !== 1 || prop !== "length",
      enumerable: desc.enumerable,
      value: owner[prop]
    };
  },
  defineProperty() {
    die(11);
  },
  getPrototypeOf(state) {
    return getPrototypeOf(state.base_);
  },
  setPrototypeOf() {
    die(12);
  }
};
var arrayTraps = {};
each(objectTraps, (key, fn) => {
  arrayTraps[key] = function() {
    arguments[0] = arguments[0][0];
    return fn.apply(this, arguments);
  };
});
arrayTraps.deleteProperty = function(state, prop) {
  if (process.env.NODE_ENV !== "production" && isNaN(parseInt(prop)))
    die(13);
  return arrayTraps.set.call(this, state, prop, void 0);
};
arrayTraps.set = function(state, prop, value) {
  if (process.env.NODE_ENV !== "production" && prop !== "length" && isNaN(parseInt(prop)))
    die(14);
  return objectTraps.set.call(this, state[0], prop, value, state[0]);
};
function peek(draft, prop) {
  const state = draft[DRAFT_STATE];
  const source = state ? latest(state) : draft;
  return source[prop];
}
function readPropFromProto(state, source, prop) {
  const desc = getDescriptorFromProto(source, prop);
  return desc ? `value` in desc ? desc.value : (
    // This is a very special case, if the prop is a getter defined by the
    // prototype, we should invoke it with the draft as context!
    desc.get?.call(state.draft_)
  ) : void 0;
}
function getDescriptorFromProto(source, prop) {
  if (!(prop in source))
    return void 0;
  let proto = getPrototypeOf(source);
  while (proto) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (desc)
      return desc;
    proto = getPrototypeOf(proto);
  }
  return void 0;
}
function markChanged(state) {
  if (!state.modified_) {
    state.modified_ = true;
    if (state.parent_) {
      markChanged(state.parent_);
    }
  }
}
function prepareCopy(state) {
  if (!state.copy_) {
    state.copy_ = shallowCopy(
      state.base_,
      state.scope_.immer_.useStrictShallowCopy_
    );
  }
}
var Immer2 = class {
  constructor(config) {
    this.autoFreeze_ = true;
    this.useStrictShallowCopy_ = false;
    this.produce = (base, recipe, patchListener) => {
      if (typeof base === "function" && typeof recipe !== "function") {
        const defaultBase = recipe;
        recipe = base;
        const self = this;
        return function curriedProduce(base2 = defaultBase, ...args) {
          return self.produce(base2, (draft) => recipe.call(this, draft, ...args));
        };
      }
      if (typeof recipe !== "function")
        die(6);
      if (patchListener !== void 0 && typeof patchListener !== "function")
        die(7);
      let result;
      if (isDraftable(base)) {
        const scope = enterScope(this);
        const proxy = createProxy(base, void 0);
        let hasError = true;
        try {
          result = recipe(proxy);
          hasError = false;
        } finally {
          if (hasError)
            revokeScope(scope);
          else
            leaveScope(scope);
        }
        usePatchesInScope(scope, patchListener);
        return processResult(result, scope);
      } else if (!base || typeof base !== "object") {
        result = recipe(base);
        if (result === void 0)
          result = base;
        if (result === NOTHING)
          result = void 0;
        if (this.autoFreeze_)
          freeze(result, true);
        if (patchListener) {
          const p = [];
          const ip = [];
          getPlugin("Patches").generateReplacementPatches_(base, result, p, ip);
          patchListener(p, ip);
        }
        return result;
      } else
        die(1, base);
    };
    this.produceWithPatches = (base, recipe) => {
      if (typeof base === "function") {
        return (state, ...args) => this.produceWithPatches(state, (draft) => base(draft, ...args));
      }
      let patches, inversePatches;
      const result = this.produce(base, recipe, (p, ip) => {
        patches = p;
        inversePatches = ip;
      });
      return [result, patches, inversePatches];
    };
    if (typeof config?.autoFreeze === "boolean")
      this.setAutoFreeze(config.autoFreeze);
    if (typeof config?.useStrictShallowCopy === "boolean")
      this.setUseStrictShallowCopy(config.useStrictShallowCopy);
  }
  createDraft(base) {
    if (!isDraftable(base))
      die(8);
    if (isDraft(base))
      base = current(base);
    const scope = enterScope(this);
    const proxy = createProxy(base, void 0);
    proxy[DRAFT_STATE].isManual_ = true;
    leaveScope(scope);
    return proxy;
  }
  finishDraft(draft, patchListener) {
    const state = draft && draft[DRAFT_STATE];
    if (!state || !state.isManual_)
      die(9);
    const { scope_: scope } = state;
    usePatchesInScope(scope, patchListener);
    return processResult(void 0, scope);
  }
  /**
   * Pass true to automatically freeze all copies created by Immer.
   *
   * By default, auto-freezing is enabled.
   */
  setAutoFreeze(value) {
    this.autoFreeze_ = value;
  }
  /**
   * Pass true to enable strict shallow copy.
   *
   * By default, immer does not copy the object descriptors such as getter, setter and non-enumrable properties.
   */
  setUseStrictShallowCopy(value) {
    this.useStrictShallowCopy_ = value;
  }
  applyPatches(base, patches) {
    let i;
    for (i = patches.length - 1; i >= 0; i--) {
      const patch = patches[i];
      if (patch.path.length === 0 && patch.op === "replace") {
        base = patch.value;
        break;
      }
    }
    if (i > -1) {
      patches = patches.slice(i + 1);
    }
    const applyPatchesImpl = getPlugin("Patches").applyPatches_;
    if (isDraft(base)) {
      return applyPatchesImpl(base, patches);
    }
    return this.produce(
      base,
      (draft) => applyPatchesImpl(draft, patches)
    );
  }
};
function createProxy(value, parent) {
  const draft = isMap(value) ? getPlugin("MapSet").proxyMap_(value, parent) : isSet(value) ? getPlugin("MapSet").proxySet_(value, parent) : createProxyProxy(value, parent);
  const scope = parent ? parent.scope_ : getCurrentScope();
  scope.drafts_.push(draft);
  return draft;
}
function current(value) {
  if (!isDraft(value))
    die(10, value);
  return currentImpl(value);
}
function currentImpl(value) {
  if (!isDraftable(value) || isFrozen(value))
    return value;
  const state = value[DRAFT_STATE];
  let copy;
  if (state) {
    if (!state.modified_)
      return state.base_;
    state.finalized_ = true;
    copy = shallowCopy(value, state.scope_.immer_.useStrictShallowCopy_);
  } else {
    copy = shallowCopy(value, true);
  }
  each(copy, (key, childValue) => {
    set(copy, key, currentImpl(childValue));
  });
  if (state) {
    state.finalized_ = false;
  }
  return copy;
}
var immer = new Immer2();
var produce = immer.produce;
var produceWithPatches = immer.produceWithPatches.bind(
  immer
);
var setAutoFreeze = immer.setAutoFreeze.bind(immer);
var setUseStrictShallowCopy = immer.setUseStrictShallowCopy.bind(immer);
var applyPatches = immer.applyPatches.bind(immer);
var createDraft = immer.createDraft.bind(immer);
var finishDraft = immer.finishDraft.bind(immer);

// ../../src/core/utils.ts
function clamp(value, min, max) {
  if (min > max) {
    [min, max] = [max, min];
  }
  return Math.min(Math.max(value, min), max);
}
function formatGameDate(startDate, date) {
  const base = new Date(startDate);
  base.setDate(base.getDate() + date);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, "0");
  const day = String(base.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ../../src/core/GameState.ts
var GameState = class {
  data;
  listeners = /* @__PURE__ */ new Set();
  resourceDefs = /* @__PURE__ */ new Map();
  constructor(initial) {
    this.data = produce(initial, () => {
    });
  }
  /** 注册资源定义（由 Game 在构造时统一注入）。 */
  registerResource(def) {
    this.resourceDefs.set(def.id, def);
  }
  /** 批量注册资源定义。 */
  registerResources(defs) {
    for (const def of defs) {
      this.registerResource(def);
    }
  }
  /** 返回当前状态只读引用 */
  read() {
    return this.data;
  }
  /** 使用 immer produce 生成新状态并通知监听器 */
  update(recipe) {
    this.data = produce(this.data, recipe);
    this.notify();
  }
  /** 订阅状态变更，返回取消订阅函数 */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  /** 用新数据替换内部状态（用于存档读取），并通知监听器 */
  resetData(data) {
    this.data = produce(data, () => {
    });
    this.notify();
  }
  // ===== 资源操作 =====
  /** 读取某资源当前数值。未注册或未初始化返回 0。 */
  getResource(id) {
    return this.data.resources[id] ?? 0;
  }
  /** 读取某资源的附加元数据。 */
  getResourceMeta(id) {
    return this.data.resourceMeta[id];
  }
  /**
   * 设置某资源数值，并按其 ResourceDefinition 限制边界。
   * 可选传入 meta，合并到该资源的元数据。
   */
  setResource(id, value, meta) {
    const safeValue = Number.isFinite(value) ? value : 0;
    const def = this.resourceDefs.get(id);
    const clamped = def ? clamp(safeValue, def.minValue, def.maxValue) : safeValue;
    this.data = produce(this.data, (draft) => {
      draft.resources[id] = clamped;
      if (meta !== void 0) {
        if (Array.isArray(draft.resourceMeta[id]) && Array.isArray(meta)) {
          draft.resourceMeta[id] = meta;
        } else {
          draft.resourceMeta[id] = { ...draft.resourceMeta[id] ?? {}, ...meta };
        }
      }
    });
    this.notify();
  }
  /**
   * 增减某资源数值（delta 可为负），自动限制边界。
   */
  addResource(id, delta) {
    const safeDelta = Number.isFinite(delta) ? delta : 0;
    const def = this.resourceDefs.get(id);
    const current2 = this.data.resources[id] ?? 0;
    const next = def ? clamp(current2 + safeDelta, def.minValue, def.maxValue) : Math.max(0, current2 + safeDelta);
    this.data = produce(this.data, (draft) => {
      draft.resources[id] = next;
    });
    this.notify();
  }
  notify() {
    const snapshot = Array.from(this.listeners);
    for (const listener of snapshot) {
      listener(this.data);
    }
  }
};

// ../../src/core/GameLoop.ts
var defaultRaf = {
  requestAnimationFrame: (cb) => globalThis.requestAnimationFrame(cb),
  cancelAnimationFrame: (handle) => globalThis.cancelAnimationFrame(handle)
};
var MS_PER_DAY = 1e3;
var GameLoop = class {
  state;
  events;
  systems;
  raf;
  speed;
  running = false;
  rafHandle = null;
  lastTime = null;
  dayAccumulator = 0;
  constructor(state, events, systems, raf = defaultRaf) {
    this.state = state;
    this.events = events;
    this.systems = systems;
    this.raf = raf;
    this.speed = state.read().speed;
  }
  /** 启动主循环（若已在运行则忽略） */
  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = null;
    this.dayAccumulator = 0;
    this.scheduleNextFrame();
  }
  /** 停止主循环，保留当前状态（speed / accumulator 重置） */
  stop() {
    this.running = false;
    if (this.rafHandle !== null) {
      this.raf.cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
    this.lastTime = null;
    this.dayAccumulator = 0;
  }
  /** 设置游戏速度倍率 */
  setSpeed(speed) {
    this.speed = speed;
  }
  /** 是否正在运行 */
  isRunning() {
    return this.running;
  }
  scheduleNextFrame() {
    if (!this.running) return;
    this.rafHandle = this.raf.requestAnimationFrame(this.tick);
  }
  /** 每帧回调 */
  tick = (time) => {
    if (!this.running) return;
    if (this.lastTime === null) {
      this.lastTime = time;
      this.scheduleNextFrame();
      return;
    }
    const deltaMs = time - this.lastTime;
    this.lastTime = time;
    if (deltaMs > 0 && this.speed > 0) {
      this.dayAccumulator += deltaMs / MS_PER_DAY * this.speed;
      let remaining = Math.floor(this.dayAccumulator);
      const maxDaysPerFrame = 60;
      if (remaining > maxDaysPerFrame) {
        this.dayAccumulator -= remaining - maxDaysPerFrame;
        remaining = maxDaysPerFrame;
      }
      for (let i = 0; i < remaining; i++) {
        this.dayAccumulator -= 1;
        this.advanceDay();
      }
    }
    this.scheduleNextFrame();
  };
  /** 推进一个游戏日 */
  advanceDay() {
    const beforeDate = this.state.read().date;
    this.events.emit("DAY_START", beforeDate);
    for (const system of this.systems) {
      system.update(this.state, this.events, 1);
    }
    this.state.update((draft) => {
      draft.date += 1;
    });
    this.events.emit("DAY_END", this.state.read().date);
  }
};

// ../../src/core/resources/ResourceRegistry.ts
var ResourceRegistry = class {
  defs = /* @__PURE__ */ new Map();
  /** 注册一个资源定义。若 id 已存在则覆盖。 */
  register(def) {
    this.defs.set(def.id, def);
  }
  /** 批量注册。 */
  registerAll(defs) {
    for (const def of defs) {
      this.register(def);
    }
  }
  /** 根据 id 获取资源定义，若不存在则抛错。 */
  get(id) {
    const def = this.defs.get(id);
    if (!def) {
      throw new Error(`[ResourceRegistry] \u672A\u6CE8\u518C\u7684\u8D44\u6E90: ${id}`);
    }
    return def;
  }
  /** 安全获取：不存在返回 undefined。 */
  tryGet(id) {
    return this.defs.get(id);
  }
  /** 是否已注册某资源。 */
  has(id) {
    return this.defs.has(id);
  }
  /** 获取所有已注册资源定义。 */
  getAll() {
    return Array.from(this.defs.values());
  }
  /** 按分类获取资源定义。 */
  getByCategory(cat) {
    return this.getAll().filter((d) => d.category === cat);
  }
  /** 获取应在顶部栏显示的资源。 */
  getTopBarResources() {
    return this.getAll().filter((d) => d.uiConfig?.showInTopBar === true);
  }
};

// ../../src/core/config/resources.ts
var INITIAL_RESOURCES = [
  // ===== 货币 =====
  {
    id: "funds",
    name: "\u8D44\u91D1",
    category: "currency",
    isContinuous: true,
    minValue: -Infinity,
    maxValue: Infinity,
    initialValue: 1e6,
    uiConfig: { icon: "\u{1F4B0}", color: "#ffd76b", showInTopBar: true, format: "currency" }
  },
  // ===== 算力 =====
  {
    id: "compute_power",
    name: "\u7B97\u529B",
    category: "asset",
    isContinuous: true,
    minValue: 0,
    maxValue: Infinity,
    initialValue: 0,
    // 由开局预设决定
    uiConfig: { icon: "\u{1F9E0}", color: "#a78bfa", showInTopBar: true, format: "tflops" }
  },
  // ===== 硬件（不在顶栏显示，详情见资源面板） =====
  {
    id: "compute_l40s",
    name: "L40S \u8BA1\u7B97\u5361",
    category: "hardware",
    isContinuous: false,
    minValue: 0,
    maxValue: 1e4,
    initialValue: 0,
    uiConfig: { icon: "\u{1F5A5}\uFE0F", color: "#56dce6", showInTopBar: false, format: "number" }
  },
  {
    id: "compute_a100_40g",
    name: "A100 40GB",
    category: "hardware",
    isContinuous: false,
    minValue: 0,
    maxValue: 1e4,
    initialValue: 0,
    uiConfig: { icon: "\u{1F5A5}\uFE0F", color: "#56dce6", showInTopBar: false, format: "number" }
  },
  {
    id: "compute_a100",
    name: "A100 80GB",
    category: "hardware",
    isContinuous: false,
    minValue: 0,
    maxValue: 1e4,
    initialValue: 0,
    // 由开局预设决定
    uiConfig: { icon: "\u{1F5A5}\uFE0F", color: "#56dce6", showInTopBar: false, format: "number" }
  },
  {
    id: "compute_h100",
    name: "H100 80GB",
    category: "hardware",
    isContinuous: false,
    minValue: 0,
    maxValue: 1e4,
    initialValue: 0,
    uiConfig: { icon: "\u{1F5A5}\uFE0F", color: "#56dce6", showInTopBar: false, format: "number" }
  },
  {
    id: "compute_h200",
    name: "H200 141GB",
    category: "hardware",
    isContinuous: false,
    minValue: 0,
    maxValue: 1e4,
    initialValue: 0,
    uiConfig: { icon: "\u{1F5A5}\uFE0F", color: "#56dce6", showInTopBar: false, format: "number" }
  },
  {
    id: "compute_b200",
    name: "B200 192GB",
    category: "hardware",
    isContinuous: false,
    minValue: 0,
    maxValue: 1e4,
    initialValue: 0,
    uiConfig: { icon: "\u{1F5A5}\uFE0F", color: "#56dce6", showInTopBar: false, format: "number" }
  },
  {
    id: "compute_gb200",
    name: "GB200 192GB",
    category: "hardware",
    isContinuous: false,
    minValue: 0,
    maxValue: 1e4,
    initialValue: 0,
    uiConfig: { icon: "\u{1F5A5}\uFE0F", color: "#56dce6", showInTopBar: false, format: "number" }
  },
  {
    id: "compute_gb300",
    name: "GB300 288GB",
    category: "hardware",
    isContinuous: false,
    minValue: 0,
    maxValue: 1e4,
    initialValue: 0,
    uiConfig: { icon: "\u{1F5A5}\uFE0F", color: "#56dce6", showInTopBar: false, format: "number" }
  },
  {
    id: "compute_blackwell_ultra",
    name: "Blackwell Ultra 288GB",
    category: "hardware",
    isContinuous: false,
    minValue: 0,
    maxValue: 1e4,
    initialValue: 0,
    uiConfig: { icon: "\u{1F5A5}\uFE0F", color: "#56dce6", showInTopBar: false, format: "number" }
  },
  {
    id: "compute_rubin",
    name: "RUBIN 384GB",
    category: "hardware",
    isContinuous: false,
    minValue: 0,
    maxValue: 1e4,
    initialValue: 0,
    uiConfig: { icon: "\u{1F5A5}\uFE0F", color: "#56dce6", showInTopBar: false, format: "number" }
  },
  {
    id: "compute_rubin_ultra",
    name: "RUBIN Ultra 512GB",
    category: "hardware",
    isContinuous: false,
    minValue: 0,
    maxValue: 1e4,
    initialValue: 0,
    uiConfig: { icon: "\u{1F5A5}\uFE0F", color: "#56dce6", showInTopBar: false, format: "number" }
  },
  // ===== 电力 =====
  {
    id: "power_kw",
    name: "\u7535\u529B\u5BB9\u91CF",
    category: "energy",
    isContinuous: true,
    minValue: 0,
    maxValue: 1e6,
    initialValue: 0,
    // 无初始电站，超容自动从电网购电
    uiConfig: { icon: "\u26A1", color: "#ffb454", showInTopBar: true, format: "number" }
  },
  // ===== 普通员工（每种角色对应一种资源） =====
  {
    id: "staff_researcher",
    name: "\u7814\u7A76\u5458\uFF08\u666E\u901A\uFF09",
    category: "human",
    isContinuous: false,
    minValue: 0,
    maxValue: 500,
    initialValue: 0,
    uiConfig: { icon: "\u{1F468}\u200D\u{1F52C}", color: "#a78bfa", showInTopBar: false, format: "number" }
  },
  {
    id: "staff_data_engineer",
    name: "\u6570\u636E\u5DE5\u7A0B\u5E08\uFF08\u666E\u901A\uFF09",
    category: "human",
    isContinuous: false,
    minValue: 0,
    maxValue: 500,
    initialValue: 0,
    uiConfig: { icon: "\u{1F469}\u200D\u{1F4BB}", color: "#a78bfa", showInTopBar: false, format: "number" }
  },
  {
    id: "staff_system_engineer",
    name: "\u7CFB\u7EDF\u5DE5\u7A0B\u5E08\uFF08\u666E\u901A\uFF09",
    category: "human",
    isContinuous: false,
    minValue: 0,
    maxValue: 500,
    initialValue: 0,
    uiConfig: { icon: "\u{1F527}", color: "#a78bfa", showInTopBar: false, format: "number" }
  },
  {
    id: "staff_product_manager",
    name: "\u4EA7\u54C1\u7ECF\u7406\uFF08\u666E\u901A\uFF09",
    category: "human",
    isContinuous: false,
    minValue: 0,
    maxValue: 500,
    initialValue: 0,
    uiConfig: { icon: "\u{1F4CB}", color: "#a78bfa", showInTopBar: false, format: "number" }
  },
  {
    id: "staff_legal_pr",
    name: "\u6CD5\u52A1/\u516C\u5173\uFF08\u666E\u901A\uFF09",
    category: "human",
    isContinuous: false,
    minValue: 0,
    maxValue: 500,
    initialValue: 0,
    uiConfig: { icon: "\u2696\uFE0F", color: "#a78bfa", showInTopBar: false, format: "number" }
  },
  {
    id: "staff_manager",
    name: "\u7BA1\u7406\u4EBA\u5458\uFF08\u666E\u901A\uFF09",
    category: "human",
    isContinuous: false,
    minValue: 0,
    maxValue: 50,
    // 远小于其他 staff 的 500（高管稀缺）
    initialValue: 0,
    uiConfig: { icon: "\u{1F465}", color: "#ffd76b", showInTopBar: false, format: "number" }
  }
];
var HARDWARE_SPECS = [
  {
    resourceId: "compute_l40s",
    powerPerCard: 0.3,
    tflopsPerCard: 733,
    unitCost: 8e3,
    deliveryDays: 3,
    wearPerDay: 6e-4
  },
  {
    resourceId: "compute_a100_40g",
    powerPerCard: 0.3,
    tflopsPerCard: 312,
    unitCost: 6e3,
    deliveryDays: 2,
    wearPerDay: 1e-3
  },
  {
    resourceId: "compute_a100",
    powerPerCard: 0.4,
    tflopsPerCard: 624,
    unitCost: 1e4,
    deliveryDays: 3,
    wearPerDay: 8e-4
  },
  {
    resourceId: "compute_h100",
    powerPerCard: 0.7,
    tflopsPerCard: 1979,
    unitCost: 3e4,
    deliveryDays: 7,
    wearPerDay: 5e-4
  },
  {
    resourceId: "compute_h200",
    powerPerCard: 0.7,
    tflopsPerCard: 1979,
    unitCost: 4e4,
    deliveryDays: 10,
    wearPerDay: 4e-4
  },
  {
    resourceId: "compute_b200",
    powerPerCard: 1,
    tflopsPerCard: 4500,
    unitCost: 45e3,
    deliveryDays: 14,
    wearPerDay: 3e-4
  },
  {
    resourceId: "compute_gb200",
    powerPerCard: 1.2,
    tflopsPerCard: 5e3,
    unitCost: 6e4,
    deliveryDays: 18,
    wearPerDay: 25e-5
  },
  {
    resourceId: "compute_gb300",
    powerPerCard: 1.5,
    tflopsPerCard: 7500,
    unitCost: 75e3,
    deliveryDays: 21,
    wearPerDay: 2e-4
  },
  {
    resourceId: "compute_blackwell_ultra",
    powerPerCard: 1.4,
    tflopsPerCard: 9e3,
    unitCost: 7e4,
    deliveryDays: 21,
    wearPerDay: 2e-4
  },
  {
    resourceId: "compute_rubin",
    powerPerCard: 1.6,
    tflopsPerCard: 12e3,
    unitCost: 9e4,
    deliveryDays: 28,
    wearPerDay: 18e-5
  },
  {
    resourceId: "compute_rubin_ultra",
    powerPerCard: 2,
    tflopsPerCard: 18e3,
    unitCost: 12e4,
    deliveryDays: 35,
    wearPerDay: 15e-5
  }
];
var POWER_CONFIG = {
  /** 每千瓦时电价（美元） */
  pricePerKWh: 0.12,
  /** 基础设施日耗电 kW（机房、照明、冷却） */
  baseConsumptionKW: 5,
  /** 建造电站每 kW 造价（美元） */
  powerPlantCostPerKW: 800
};

// ../../src/core/config/dataAcquisition.ts
var COLLECTION_ROUTES = [
  {
    id: "public_crawl",
    name: "\u516C\u5F00\u722C\u866B",
    description: "\u722C\u53D6\u516C\u5F00\u7F51\u7EDC\u5185\u5BB9",
    baseRate: 1,
    baseQuality: 0.5,
    qualityCap: 0.75,
    dailyCost: 100,
    targetDomains: ["web", "multilingual"]
  },
  {
    id: "deep_crawl",
    name: "\u6DF1\u5EA6\u722C\u53D6",
    description: "\u6DF1\u5EA6\u722C\u53D6\u4E66\u7C4D\u3001\u8BBA\u6587\u3001\u6280\u672F\u6587\u6863",
    baseRate: 0.5,
    baseQuality: 0.6,
    qualityCap: 0.8,
    dailyCost: 200,
    targetDomains: ["web", "books"]
  },
  {
    id: "code_collection",
    name: "\u4EE3\u7801\u6536\u96C6",
    description: "\u4ECE\u5F00\u6E90\u4ED3\u5E93\u6536\u96C6\u4EE3\u7801\u6570\u636E",
    baseRate: 0.3,
    baseQuality: 0.75,
    qualityCap: 0.92,
    dailyCost: 150,
    targetDomains: ["code"]
  },
  {
    id: "academic_collection",
    name: "\u5B66\u672F\u6536\u96C6",
    description: "\u6536\u96C6\u5B66\u672F\u8BBA\u6587\u548C\u6570\u5B66\u516C\u5F0F\u6570\u636E",
    baseRate: 0.2,
    baseQuality: 0.82,
    qualityCap: 0.96,
    dailyCost: 300,
    targetDomains: ["science", "math"]
  },
  {
    id: "professional_annotation",
    name: "\u4E13\u4E1A\u6807\u6CE8",
    description: "\u4E13\u4E1A\u6807\u6CE8\u56E2\u961F\u751F\u6210\u9AD8\u8D28\u91CF\u5BF9\u8BDD\u6570\u636E",
    baseRate: 0.1,
    baseQuality: 0.85,
    qualityCap: 0.98,
    dailyCost: 500,
    targetDomains: ["dialogue", "user_feedback"]
  },
  {
    id: "multimodal_annotation",
    name: "\u591A\u6A21\u6001\u6807\u6CE8",
    description: "\u56FE\u50CF\u3001\u89C6\u9891\u3001\u97F3\u9891\u591A\u6A21\u6001\u6570\u636E\u6807\u6CE8",
    baseRate: 0.05,
    baseQuality: 0.8,
    qualityCap: 0.95,
    dailyCost: 800,
    targetDomains: ["multimodal"]
  },
  {
    id: "rl_synthesis",
    name: "RL\u5408\u6210",
    description: "\u901A\u8FC7RL\u5408\u6210\u53EF\u9A8C\u8BC1\u4EFB\u52A1\u6570\u636E",
    baseRate: 0.2,
    baseQuality: 0.8,
    qualityCap: 0.95,
    dailyCost: 1e3,
    targetDomains: ["rl_data", "code", "math"],
    requiredTech: "rlhf"
  },
  {
    id: "internal_synthesis",
    name: "\u5185\u90E8\u6A21\u578B\u5408\u6210",
    description: "\u4F7F\u7528\u5185\u90E8\u6A21\u578B\u751F\u6210\u5408\u6210\u6570\u636E",
    baseRate: 0.5,
    baseQuality: 0.65,
    qualityCap: 0.88,
    dailyCost: 1500,
    targetDomains: ["synthetic", "code"],
    requiredTech: "distillation"
  }
];
var PURCHASE_ROUTES = [
  {
    id: "purchase_open",
    name: "\u516C\u5F00\u6570\u636E\u96C6",
    description: "\u8D2D\u4E70\u516C\u5F00\u53EF\u552E\u6570\u636E\u96C6",
    cost: 5e4,
    targetDomains: ["web", "books"],
    tokensProduced: 20,
    quality: 0.7,
    isGrey: false,
    legalDebtIncrement: 0,
    trustDebtIncrement: 0,
    moraleLoss: 0,
    cooldownDays: 7
  },
  {
    id: "purchase_commercial_a",
    name: "\u5546\u4E1A\u6570\u636E\u5305A",
    description: "\u8D2D\u4E70\u4EE3\u7801\u548C\u79D1\u6280\u9886\u57DF\u5546\u4E1A\u6570\u636E",
    cost: 2e5,
    targetDomains: ["code", "science"],
    tokensProduced: 30,
    quality: 0.88,
    isGrey: false,
    legalDebtIncrement: 0,
    trustDebtIncrement: 0,
    moraleLoss: 0,
    cooldownDays: 10
  },
  {
    id: "purchase_commercial_b",
    name: "\u5546\u4E1A\u6570\u636E\u5305B",
    description: "\u8D2D\u4E70\u5BF9\u8BDD\u548C\u591A\u8BED\u8A00\u5546\u4E1A\u6570\u636E",
    cost: 5e5,
    targetDomains: ["dialogue", "multilingual"],
    tokensProduced: 50,
    quality: 0.92,
    isGrey: false,
    legalDebtIncrement: 0,
    trustDebtIncrement: 0,
    moraleLoss: 0,
    cooldownDays: 14
  },
  {
    id: "purchase_proprietary",
    name: "\u4E13\u6709\u6570\u636E\u96C6",
    description: "\u8D2D\u4E70\u9AD8\u8D28\u91CF\u5168\u9886\u57DF\u4E13\u6709\u6570\u636E",
    cost: 1e6,
    targetDomains: ["web", "books", "code", "science", "dialogue", "multilingual"],
    tokensProduced: 100,
    quality: 0.96,
    isGrey: false,
    legalDebtIncrement: 0,
    trustDebtIncrement: 0,
    moraleLoss: 0,
    cooldownDays: 30
  },
  {
    id: "distill_competitor",
    name: "\u84B8\u998F\u7ADE\u54C1",
    description: "\u84B8\u998F\u7ADE\u4E89\u5BF9\u624B\u6A21\u578B",
    cost: 2e4,
    targetDomains: ["synthetic", "dialogue"],
    tokensProduced: 15,
    quality: 0.75,
    isGrey: true,
    legalDebtIncrement: 0.5,
    trustDebtIncrement: 0.3,
    moraleLoss: 2,
    cooldownDays: 14
  },
  {
    id: "user_data_full",
    name: "\u7528\u6237\u6570\u636E(\u5168\u90E8)",
    description: "\u8FDD\u53CD\u653F\u7B56\u4F7F\u7528\u5168\u90E8\u7528\u6237\u6570\u636E",
    cost: 0,
    targetDomains: ["user_feedback", "dialogue"],
    tokensProduced: 30,
    quality: 0.95,
    isGrey: true,
    legalDebtIncrement: 2,
    trustDebtIncrement: 1.5,
    moraleLoss: 8,
    cooldownDays: 1
  }
];
var COLLECTION_MAP = Object.fromEntries(COLLECTION_ROUTES.map((r) => [r.id, r]));
var PURCHASE_MAP = Object.fromEntries(PURCHASE_ROUTES.map((r) => [r.id, r]));
function calcCollectionRate(normalEngineerCount, coreEngineerCount, route) {
  return (normalEngineerCount * 1 + coreEngineerCount * 1.5) * route.baseRate;
}
function calcCollectionQuality(coreEngineerCount, route) {
  return Math.min(route.qualityCap, route.baseQuality + coreEngineerCount * 0.05);
}

// ../../src/core/config/techTree.ts
var IDEA_TECH_MAP = {};
var TECH_TREE = [
  {
    id: "pretraining",
    name: "\u9884\u8BAD\u7EC3",
    description: "\u57FA\u7840\u8BED\u8A00\u6A21\u578B\u9884\u8BAD\u7EC3",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "modify_base_score_E", value: 0 },
    isArchitecture: false,
    difficulty: 1
  },
  {
    id: "sft",
    name: "\u76D1\u7763\u5FAE\u8C03(SFT)",
    description: "\u89E3\u9501\u540E\u8BAD\u7EC3\uFF1A\u76D1\u7763\u5FAE\u8C03\u9636\u6BB5\uFF08SFT\uFF09",
    prerequisites: ["pretraining"],
    researchDays: 15,
    researchCost: 5e4,
    // PR-B v3：改为解锁 SFT 后训练阶段 → 算力 = P×2 TFLOPS·天，资金 = $10k×P，增益按 maturity/100 缩放
    effect: { type: "unlock_sft" },
    isArchitecture: false,
    difficulty: 2
  },
  {
    id: "flash_attention",
    name: "FlashAttention",
    description: "IO \u611F\u77E5\u6CE8\u610F\u529B\uFF0C\u964D\u4F4E\u663E\u5B58\u5360\u7528 20%",
    prerequisites: ["pretraining"],
    researchDays: 20,
    researchCost: 8e4,
    effect: { type: "reduce_memory", value: 0.2 },
    isArchitecture: false,
    difficulty: 3
  },
  {
    id: "flash_attention_2",
    name: "FlashAttention v2",
    description: "\u8FDB\u4E00\u6B65\u63D0\u5347\u6548\u7387\uFF0C\u8BAD\u7EC3\u7B97\u529B -10%",
    prerequisites: ["flash_attention"],
    researchDays: 25,
    researchCost: 12e4,
    effect: { type: "reduce_compute_cost", value: 0.1 },
    isArchitecture: false,
    difficulty: 4
  },
  {
    id: "rope",
    name: "\u65CB\u8F6C\u4F4D\u7F6E\u7F16\u7801(RoPE)",
    description: "\u4F18\u5F02\u7684\u957F\u5EA6\u5916\u63A8\u6027\uFF0C\u4E0A\u4E0B\u6587 \xD74",
    prerequisites: ["pretraining"],
    researchDays: 18,
    researchCost: 6e4,
    effect: { type: "extend_context", multiplier: 4 },
    isArchitecture: true,
    difficulty: 3
  },
  {
    id: "moe",
    name: "\u6DF7\u5408\u4E13\u5BB6(MoE)",
    description: "\u7A00\u758F\u6FC0\u6D3B\u63D0\u5347\u53C2\u6570\u6548\u7387\uFF0CA -200",
    prerequisites: ["pretraining"],
    researchDays: 40,
    researchCost: 3e5,
    effect: { type: "modify_base_score_A", value: -200 },
    isArchitecture: true,
    difficulty: 5
  },
  {
    id: "data_cleaning_v1",
    name: "\u6570\u636E\u6E05\u6D17v1",
    description: "\u89E3\u9501\u6570\u636E\u6E05\u6D17\u64CD\u4F5C\uFF08\u79FB\u9664\u4F4E\u8D28\u91CFtokens\uFF09",
    prerequisites: ["pretraining"],
    researchDays: 12,
    researchCost: 4e4,
    // PR-B v3：改为解锁 purge 操作 → 清洗比例 = 15%×maturity/100，质量增益 = (1-当前质量)×10%×maturity/100
    effect: { type: "unlock_data_purge", maxTokensBase: 2 },
    isArchitecture: false,
    difficulty: 2
  },
  {
    id: "zero_1",
    name: "ZeRO-1",
    description: "\u4F18\u5316\u5668\u72B6\u6001\u5206\u7247\uFF0C\u663E\u5B58 -15%",
    prerequisites: ["pretraining"],
    researchDays: 15,
    researchCost: 5e4,
    effect: { type: "reduce_memory", value: 0.15 },
    isArchitecture: false,
    difficulty: 3
  },
  {
    id: "swiglu",
    name: "SwiGLU",
    description: "\u95E8\u63A7\u6FC0\u6D3B\u51FD\u6570\u63D0\u5347\u8D28\u91CF\uFF0CA -60",
    prerequisites: ["pretraining"],
    researchDays: 15,
    researchCost: 6e4,
    effect: { type: "modify_base_score_A", value: -60 },
    isArchitecture: true,
    difficulty: 3
  },
  {
    id: "rmsnorm",
    name: "RMSNorm",
    description: "\u9AD8\u6548\u5F52\u4E00\u5316\uFF0C\u8BAD\u7EC3\u7B97\u529B -5%",
    prerequisites: ["pretraining"],
    researchDays: 10,
    researchCost: 3e4,
    effect: { type: "reduce_compute_cost", value: 0.05 },
    isArchitecture: false,
    difficulty: 2
  },
  {
    id: "pre_ln",
    name: "Pre-LN",
    description: "\u524D\u7F6E\u5F52\u4E00\u5316\u63D0\u5347\u8BAD\u7EC3\u7A33\u5B9A\u6027\uFF0CE +0.2",
    prerequisites: ["pretraining"],
    researchDays: 12,
    researchCost: 4e4,
    effect: { type: "modify_base_score_E", value: 0.2 },
    isArchitecture: false,
    difficulty: 2
  }
];
var TECH_TREE_P1 = [
  {
    id: "rlhf",
    name: "RLHF",
    description: "\u89E3\u9501\u540E\u8BAD\u7EC3\uFF1ARLHF \u4EBA\u7C7B\u53CD\u9988\u5F3A\u5316\u5B66\u4E60",
    prerequisites: ["sft"],
    researchDays: 30,
    researchCost: 2e5,
    // PR-B v3：改为解锁 RLHF 后训练阶段 → 算力 P×5，资金 $30k×P，增益按 maturity/100 缩放
    effect: { type: "unlock_rlhf" },
    isArchitecture: false,
    difficulty: 4
  },
  {
    id: "dpo",
    name: "DPO",
    description: "\u89E3\u9501\u540E\u8BAD\u7EC3\uFF1ADPO \u76F4\u63A5\u504F\u597D\u4F18\u5316",
    prerequisites: ["rlhf"],
    researchDays: 20,
    researchCost: 15e4,
    // PR-B v3：改为解锁 DPO 后训练阶段（与 RLHF 互斥） → 算力 P×3，资金 $15k×P
    effect: { type: "unlock_dpo" },
    isArchitecture: false,
    difficulty: 4
  },
  {
    id: "cot_training",
    name: "CoT\u8BAD\u7EC3",
    description: "\u89E3\u9501\u540E\u8BAD\u7EC3\uFF1A\u601D\u7EF4\u94FE\u8BAD\u7EC3",
    prerequisites: ["sft"],
    researchDays: 25,
    researchCost: 12e4,
    // PR-B v3：改为解锁 CoT 后训练阶段 → 算力 P×4，资金 $20k×P
    effect: { type: "unlock_cot" },
    isArchitecture: false,
    difficulty: 4
  },
  {
    id: "data_deduplication",
    name: "\u6570\u636E\u53BB\u91CD",
    description: "\u89E3\u9501\u6570\u636E\u53BB\u91CD\u64CD\u4F5C\uFF08\u524A\u51CF\u91CD\u590Dtokens\uFF09",
    prerequisites: ["data_cleaning_v1"],
    researchDays: 15,
    researchCost: 6e4,
    // PR-B v3：改为解锁 dedup 操作 → 重复度削减 = 当前重复度×20%×maturity/100
    effect: { type: "unlock_data_dedup", maxTokensBase: 5 },
    isArchitecture: false,
    difficulty: 3
  },
  {
    id: "data_curation",
    name: "\u6570\u636E\u7CBE\u9009",
    description: "\u89E3\u9501\u6570\u636E\u7CBE\u9009\u64CD\u4F5C\uFF08\u63D0\u5347\u76EE\u6807\u57DF\u8D28\u91CF\uFF09",
    prerequisites: ["data_deduplication"],
    researchDays: 20,
    researchCost: 1e5,
    // PR-B v3：改为解锁 curate 操作 → 目标域质量增益 = (1-当前域质量)×15%×maturity/100
    effect: { type: "unlock_data_curate", maxTokensBase: 3 },
    isArchitecture: false,
    difficulty: 4
  },
  {
    id: "stable_training",
    name: "\u7A33\u5B9A\u8BAD\u7EC3",
    description: "\u9632\u6B62\u8BAD\u7EC3\u5D29\u6E83\uFF0C\u6982\u7387-50%",
    prerequisites: ["pre_ln"],
    researchDays: 25,
    researchCost: 1e5,
    effect: { type: "reduce_training_crash_risk", value: 0.5 },
    isArchitecture: false,
    difficulty: 4
  },
  {
    id: "gradient_clipping",
    name: "\u68AF\u5EA6\u88C1\u526A",
    description: "\u9632\u6B62\u68AF\u5EA6\u7206\u70B8\uFF0C\u6982\u7387-30%",
    prerequisites: ["pre_ln"],
    researchDays: 15,
    researchCost: 5e4,
    effect: { type: "reduce_training_crash_risk", value: 0.3 },
    isArchitecture: false,
    difficulty: 3
  },
  {
    id: "distillation",
    name: "\u84B8\u998F",
    description: "\u5927\u6A21\u578B\u84B8\u998F\u5230\u5C0F\u6A21\u578B",
    prerequisites: ["sft"],
    researchDays: 25,
    researchCost: 15e4,
    effect: { type: "enable_distillation", efficiencyBonus: 0.7 },
    isArchitecture: false,
    difficulty: 4
  },
  {
    id: "quantization",
    name: "\u91CF\u5316\u8BAD\u7EC3",
    description: "\u4F4E\u7CBE\u5EA6\u8BAD\u7EC3\u52A0\u901F\uFF0C\u7B97\u529B-15%",
    prerequisites: ["rmsnorm"],
    researchDays: 20,
    researchCost: 1e5,
    effect: { type: "reduce_compute_cost", value: 0.15 },
    isArchitecture: false,
    difficulty: 3
  },
  {
    id: "long_context_training",
    name: "\u957F\u4E0A\u4E0B\u6587\u8BAD\u7EC3",
    description: "\u652F\u6301\u8D85\u957F\u4E0A\u4E0B\u6587\uFF0C\xD78",
    prerequisites: ["rope", "flash_attention_2"],
    researchDays: 35,
    researchCost: 25e4,
    effect: { type: "extend_context", multiplier: 8 },
    isArchitecture: false,
    difficulty: 5
  },
  {
    id: "auto_research",
    name: "\u81EA\u52A8\u79D1\u7814\u8F85\u52A9",
    description: "AI\u8F85\u52A9\u7814\u53D1\uFF0C\u901F\u5EA6+50%",
    prerequisites: ["rlhf", "cot_training"],
    researchDays: 50,
    researchCost: 5e5,
    effect: { type: "improve_research_speed", value: 0.5 },
    isArchitecture: false,
    difficulty: 8
  },
  {
    id: "alignment_v1",
    name: "\u5BF9\u9F50v1",
    description: "\u57FA\u7840\u5BF9\u9F50\u6280\u672F",
    prerequisites: ["rlhf"],
    researchDays: 30,
    researchCost: 2e5,
    effect: { type: "improve_alignment", value: 0.3 },
    isArchitecture: false,
    difficulty: 5
  },
  {
    id: "cev_alignment",
    name: "CEV\u5BF9\u9F50",
    description: "\u8FDE\u8D2F\u5916\u63A8\u610F\u5FD7\u5BF9\u9F50",
    prerequisites: ["alignment_v1", "auto_research"],
    researchDays: 60,
    researchCost: 8e5,
    effect: { type: "improve_alignment", value: 0.5 },
    isArchitecture: false,
    difficulty: 10
  }
];
var TECH_TREE_P2 = [
  {
    id: "pipeline_parallel",
    name: "\u6D41\u6C34\u7EBF\u5E76\u884C (PP)",
    description: "\u6309\u5C42\u5207\u5206\u6A21\u578B\u6D41\u6C34\u7EBF\u4F20\u9012\u6FC0\u6D3B\u503C\u3002\u6210\u719F\u5EA6\u964D\u4F4E\u5E76\u884C\u6545\u969C\u98CE\u9669\u3002bubble \u5F00\u9500 = 1/(2\xD7\u6BB5\u6570)",
    prerequisites: ["flash_attention_2"],
    researchDays: 30,
    researchCost: 2e5,
    // PR-B v3：并行可靠度 → 单策略故障 = baseRisk×(1−mat/100)×(deg/safeDegree)
    effect: { type: "parallel_reliability", strategy: "pp", baseRisk: 0.15, safeDegree: 4 },
    isArchitecture: false,
    difficulty: 4
  },
  {
    id: "tensor_parallel",
    name: "\u5F20\u91CF\u5E76\u884C (TP)",
    description: "\u6309\u7EF4\u5EA6\u5207\u5F00\u6BCF\u5C42\u77E9\u9635\u5206\u62C5\u53C2\u6570\u3002TP \u98CE\u9669\u6700\u9AD8\uFF08baseRisk 0.25\uFF09\uFF0C\u9700\u5168\u8282\u70B9\u540C\u6B65",
    prerequisites: ["zero_1", "pipeline_parallel"],
    researchDays: 40,
    researchCost: 35e4,
    effect: { type: "parallel_reliability", strategy: "tp", baseRisk: 0.25, safeDegree: 4 },
    isArchitecture: false,
    difficulty: 5
  },
  {
    id: "expert_parallel",
    name: "\u4E13\u5BB6\u5E76\u884C (EP)",
    description: "MoE \u4E13\u5BB6\u52A8\u6001\u5206\u914D\u81F3 GPU\u3002EP \u6700\u5BB9\u9519\uFF08baseRisk 0.10, safeDegree=8\uFF09",
    prerequisites: ["moe", "pipeline_parallel"],
    researchDays: 45,
    researchCost: 5e5,
    effect: { type: "parallel_reliability", strategy: "ep", baseRisk: 0.1, safeDegree: 8 },
    isArchitecture: false,
    difficulty: 6
  },
  {
    id: "context_parallel",
    name: "\u4E0A\u4E0B\u6587\u5E76\u884C (CP)",
    description: "\u6309\u5E8F\u5217\u7EF4\u5EA6\u5207\u5206\u6CE8\u610F\u529B\u8BA1\u7B97\uFF0C\u652F\u6491\u8D85\u957F\u4E0A\u4E0B\u6587\u3002Ring/Ulysses \u6DF7\u5408\u8DEF\u7EBF",
    prerequisites: ["rope", "flash_attention_2"],
    researchDays: 35,
    researchCost: 3e5,
    effect: { type: "parallel_reliability", strategy: "cp", baseRisk: 0.12, safeDegree: 4 },
    isArchitecture: false,
    difficulty: 5
  }
];
var ALL_TECH = [...TECH_TREE, ...TECH_TREE_P1, ...TECH_TREE_P2];
var TECH_MAP = Object.fromEntries(ALL_TECH.map((t) => [t.id, t]));

// ../../src/core/config/ideaTechPool.ts
var IDEA_TECH_POOL = [
  {
    id: "mixture_of_depths",
    name: "MoD \u6DF7\u5408\u6DF1\u5EA6",
    description: "\u52A8\u6001\u8DF3\u8FC7\u90E8\u5206\u5C42\u8BA1\u7B97\uFF0C\u7B97\u529B -8%",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "reduce_compute_cost", value: 0.08 },
    isArchitecture: false,
    source: "idea",
    difficulty: 4
  },
  {
    id: "sparse_attention_v2",
    name: "\u7A00\u758F\u6CE8\u610F\u529B v2",
    description: "\u66F4\u9AD8\u6548\u7684\u7A00\u758F\u6A21\u5F0F\uFF0C\u4E0A\u4E0B\u6587 \xD72",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "extend_context", multiplier: 2 },
    isArchitecture: true,
    source: "idea",
    difficulty: 4
  },
  {
    id: "dynamic_routing",
    name: "\u52A8\u6001\u8DEF\u7531",
    description: "\u81EA\u9002\u5E94\u8BA1\u7B97\u8DEF\u5F84\uFF0C\u5B9E\u7528\u63A8\u7406 +5%",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "capability_bonus", capability: "pragmatic_inference", bonus: 0.05 },
    isArchitecture: false,
    source: "idea",
    difficulty: 4
  },
  {
    id: "kv_cache_compression",
    name: "KV Cache \u538B\u7F29",
    description: "\u538B\u7F29 KV \u7F13\u5B58\uFF0C\u663E\u5B58 -10%",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "reduce_memory", value: 0.1 },
    isArchitecture: false,
    source: "idea",
    difficulty: 3
  },
  {
    id: "token_pruning",
    name: "Token \u526A\u679D",
    description: "\u52A8\u6001\u526A\u679D\u65E0\u6548 token\uFF0C\u7B97\u529B -6%",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "reduce_compute_cost", value: 0.06 },
    isArchitecture: false,
    source: "idea",
    difficulty: 3
  },
  {
    id: "contrastive_decoding",
    name: "\u5BF9\u6BD4\u89E3\u7801",
    description: "\u591A\u6A21\u578B\u5BF9\u6BD4\u63D0\u5347\u521B\u610F\u5199\u4F5C +8%",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "capability_bonus", capability: "creative_writing", bonus: 0.08 },
    isArchitecture: false,
    source: "idea",
    difficulty: 4
  },
  {
    id: "self_consistency",
    name: "\u81EA\u4E00\u81F4\u6027",
    description: "\u591A\u91C7\u6837\u6295\u7968\u63D0\u5347\u6570\u5B66\u63A8\u7406 +6%",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "capability_bonus", capability: "math_reasoning", bonus: 0.06 },
    isArchitecture: false,
    source: "idea",
    difficulty: 3
  },
  {
    id: "retrieval_augmented",
    name: "\u68C0\u7D22\u589E\u5F3A",
    description: "\u5916\u6302\u77E5\u8BC6\u5E93\uFF0C\u4E16\u754C\u77E5\u8BC6 +10%",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "capability_bonus", capability: "world_knowledge", bonus: 0.1 },
    isArchitecture: false,
    source: "idea",
    difficulty: 4
  },
  {
    id: "long_rope",
    name: "\u957F\u7A0B RoPE",
    description: "\u6539\u8FDB\u7684\u4F4D\u7F6E\u7F16\u7801\u5916\u63A8\uFF0C\u4E0A\u4E0B\u6587 \xD76",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "extend_context", multiplier: 6 },
    isArchitecture: true,
    source: "idea",
    difficulty: 5
  },
  {
    id: "moe_routing_v2",
    name: "MoE \u8DEF\u7531 v2",
    description: "\u66F4\u5747\u8861\u7684\u4E13\u5BB6\u8DEF\u7531\uFF0C\u7F16\u7801\u80FD\u529B +6%",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "capability_bonus", capability: "coding_agent", bonus: 0.06 },
    isArchitecture: false,
    source: "idea",
    difficulty: 5
  }
];

// ../../src/core/config/openSourcePool.ts
var OPEN_SOURCE_TECH_POOL = [
  {
    id: "open_gqa",
    name: "\u5F00\u6E90 GQA",
    description: "\u5206\u7EC4\u67E5\u8BE2\u6CE8\u610F\u529B\uFF0C\u7B97\u529B -5%",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "reduce_compute_cost", value: 0.05 },
    isArchitecture: false,
    source: "open_source",
    difficulty: 3
  },
  {
    id: "open_quant_v2",
    name: "\u5F00\u6E90\u91CF\u5316\u65B9\u6848 v2",
    description: "\u793E\u533A\u4F18\u5316\u7684 INT8 \u91CF\u5316\uFF0C\u7B97\u529B -10%",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "reduce_compute_cost", value: 0.1 },
    isArchitecture: false,
    source: "open_source",
    difficulty: 3
  },
  {
    id: "open_flash_attn_v3",
    name: "\u5F00\u6E90 FlashAttention v3",
    description: "\u793E\u533A\u6539\u8FDB\u7248\uFF0C\u663E\u5B58 -12%",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "reduce_memory", value: 0.12 },
    isArchitecture: false,
    source: "open_source",
    difficulty: 4
  },
  {
    id: "open_long_rope",
    name: "\u5F00\u6E90\u957F\u7A0B RoPE",
    description: "\u793E\u533A\u5916\u63A8\u65B9\u6848\uFF0C\u4E0A\u4E0B\u6587 \xD75",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "extend_context", multiplier: 5 },
    isArchitecture: true,
    source: "open_source",
    difficulty: 5
  },
  {
    id: "open_dpo_v2",
    name: "\u5F00\u6E90 DPO v2",
    description: "\u6539\u8FDB\u7684\u504F\u597D\u4F18\u5316\uFF0C\u5229\u7528\u7387 +3%",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "improve_utilization", value: 0.03 },
    isArchitecture: false,
    source: "open_source",
    difficulty: 4
  },
  {
    id: "open_data_cleaning",
    name: "\u5F00\u6E90\u6570\u636E\u6E05\u6D17",
    description: "\u793E\u533A\u6E05\u6D17\u5DE5\u5177\u94FE\uFF0C\u6570\u636E\u8D28\u91CF +8%",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "improve_data_quality", value: 0.08 },
    isArchitecture: false,
    source: "open_source",
    difficulty: 3
  },
  {
    id: "open_swiglu_v2",
    name: "\u5F00\u6E90 SwiGLU v2",
    description: "\u6539\u8FDB\u7684\u6FC0\u6D3B\u51FD\u6570\uFF0CA -40",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "modify_base_score_A", value: -40 },
    isArchitecture: true,
    source: "open_source",
    difficulty: 4
  }
];

// ../../src/core/config/smallCompanyTech.ts
var SMALL_COMPANY_TECH_POOL = [
  {
    id: "sc_kv_cache_opt",
    name: "KV Cache \u6781\u81F4\u4F18\u5316",
    description: "\u5C0F\u516C\u53F8\u4E13\u5229\uFF0C\u663E\u5B58 -8%",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "reduce_memory", value: 0.08 },
    isArchitecture: false,
    source: "small_company",
    difficulty: 4
  },
  {
    id: "sc_dynamic_batching",
    name: "\u52A8\u6001\u6279\u5904\u7406",
    description: "\u81EA\u9002\u5E94\u6279\u5904\u7406\uFF0C\u5229\u7528\u7387 +4%",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "improve_utilization", value: 0.04 },
    isArchitecture: false,
    source: "small_company",
    difficulty: 4
  },
  {
    id: "sc_grad_accum",
    name: "\u68AF\u5EA6\u7D2F\u79EF\u4F18\u5316",
    description: "\u5927 batch \u6A21\u62DF\uFF0C\u7B97\u529B -7%",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "reduce_compute_cost", value: 0.07 },
    isArchitecture: false,
    source: "small_company",
    difficulty: 4
  },
  {
    id: "sc_moe_routing",
    name: "MoE \u8DEF\u7531\u4E13\u5229",
    description: "\u4E13\u6709\u8DEF\u7531\u7B97\u6CD5\uFF0C\u7F16\u7801\u80FD\u529B +6%",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "capability_bonus", capability: "coding_agent", bonus: 0.06 },
    isArchitecture: false,
    source: "small_company",
    difficulty: 5
  },
  {
    id: "sc_long_context",
    name: "\u957F\u4E0A\u4E0B\u6587\u4E13\u5229",
    description: "\u4E13\u6709\u957F\u4E0A\u4E0B\u6587\u65B9\u6848\uFF0C\u4E0A\u4E0B\u6587 \xD73",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "extend_context", multiplier: 3 },
    isArchitecture: true,
    source: "small_company",
    difficulty: 5
  },
  {
    id: "sc_data_dedup",
    name: "\u6570\u636E\u53BB\u91CD\u4E13\u5229",
    description: "\u4E13\u6709\u53BB\u91CD\u7B97\u6CD5\uFF0C\u6570\u636E\u8D28\u91CF +6%",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "improve_data_quality", value: 0.06 },
    isArchitecture: false,
    source: "small_company",
    difficulty: 3
  },
  {
    id: "sc_alignment_fine",
    name: "\u7CBE\u7EC6\u5BF9\u9F50",
    description: "\u4E13\u6709\u5BF9\u9F50\u65B9\u6CD5\uFF0C\u5BF9\u9F50\u5EA6 +15%",
    prerequisites: [],
    researchDays: 0,
    researchCost: 0,
    effect: { type: "improve_alignment", value: 0.15 },
    isArchitecture: false,
    source: "small_company",
    difficulty: 6
  }
];

// ../../src/core/Game.ts
var Game = class {
  state;
  events;
  registry;
  loop;
  systems;
  constructor(initialData, systems = [], registry) {
    this.events = new EventBus();
    this.registry = registry ?? new ResourceRegistry();
    this.registry.registerAll(INITIAL_RESOURCES);
    this.state = new GameState(initialData);
    this.state.registerResources(INITIAL_RESOURCES);
    this.ensureInitialResourceValues();
    this.systems = systems;
    this.loop = new GameLoop(this.state, this.events, this.systems);
  }
  /** 确保所有已注册资源在 state.resources 中有初始值 */
  ensureInitialResourceValues() {
    const current2 = this.state.read().resources;
    const needsInit = [];
    for (const def of this.registry.getAll()) {
      if (current2[def.id] === void 0) {
        needsInit.push({ id: def.id, value: def.initialValue });
      }
    }
    if (needsInit.length > 0) {
      this.state.update((draft) => {
        for (const { id, value } of needsInit) {
          draft.resources[id] = value;
        }
      });
    }
  }
  /** 执行命令 */
  executeCommand(cmd) {
    cmd.execute(this.state, this.events);
  }
  /** 启动游戏（解除暂停并启动主循环） */
  start() {
    this.state.update((draft) => {
      draft.isPaused = false;
    });
    this.loop.start();
  }
  /** 暂停游戏（停止主循环并标记暂停） */
  pause() {
    this.loop.stop();
    this.state.update((draft) => {
      draft.isPaused = true;
    });
  }
  /** 恢复游戏（解除暂停并启动主循环） */
  resume() {
    this.state.update((draft) => {
      draft.isPaused = false;
    });
    this.loop.start();
  }
  /** 设置游戏速度倍率 */
  setSpeed(speed) {
    this.state.update((draft) => {
      draft.speed = speed;
    });
    this.loop.setSpeed(speed);
  }
  /** 序列化当前状态为 JSON 字符串 */
  save() {
    return JSON.stringify(this.state.read());
  }
  /** 从 JSON 字符串读取存档并替换当前状态 */
  load(json) {
    const parsed = JSON.parse(json);
    this.migrateOldData(parsed);
    this.state.resetData(parsed);
    this.loop.setSpeed(parsed.speed);
  }
  /**
   * 旧存档数据迁移。
   * 当前迁移：
   * - DataCollectionProject.normalEngineerCount（设计-4 引入）
   * - FundingRound.terms.sharesOutstanding（设计-15 引入）
   */
  migrateOldData(data) {
    if (Array.isArray(data.dataCollectionProjects)) {
      for (const proj of data.dataCollectionProjects) {
        if (proj.normalEngineerCount === void 0) {
          const route = COLLECTION_MAP[proj.routeId];
          proj.normalEngineerCount = route ? Math.max(0, Math.round(proj.dailyRate / route.baseRate - proj.engineerIds.length * 1.5)) : 0;
        }
      }
    }
    if (Array.isArray(data.fundingRounds)) {
      for (const round of data.fundingRounds) {
        if (round.type === "ipo" && round.terms.sharesOutstanding === void 0) {
          const price = round.terms.ipoPrice ?? round.terms.stockPrice;
          if (price && price > 0) {
            round.terms.sharesOutstanding = Math.round(round.amount * 1e6 / price);
          }
        }
      }
    }
    if (data.managementMode === void 0) {
      data.managementMode = "flat";
    }
    if (data.managementModeChangedDay === void 0) {
      data.managementModeChangedDay = -999;
    }
    if (data.executives === void 0) {
      data.executives = { ceoId: null, cooId: null, cfoId: null, ctoId: null };
    } else {
      data.executives.ceoId ??= null;
      data.executives.cooId ??= null;
      data.executives.cfoId ??= null;
      data.executives.ctoId ??= null;
    }
    if (!data.techMaturity) {
      const oldUnlocked = data.unlockedTechs;
      const newMat = {};
      if (Array.isArray(oldUnlocked)) {
        for (const techId of oldUnlocked) newMat[techId] = 50;
      }
      newMat["pretraining"] = 100;
      data.techMaturity = newMat;
      delete data.unlockedTechs;
    } else {
      data.techMaturity["pretraining"] ??= 100;
    }
    if (data.researchingTech) {
      data.researchingTech = null;
    }
    data.pendingIdeas ??= [];
    data.smallCompanies ??= [];
    data.openSourceOffers ??= [];
    data.acceptedIdeaTechs ??= [];
    data.lastSmallCompanyRefreshDay ??= -999;
    data.lastOpenSourceDay ??= {};
    data.experimentQueue ??= [];
    if (Array.isArray(data.researchProjects)) {
      for (const proj of data.researchProjects) {
        if (proj.repeatMode === void 0) {
          proj.repeatMode = "once";
        }
        if (proj.queueItemId === void 0) {
          proj.queueItemId = null;
        }
      }
    }
    for (const sc of data.smallCompanies) {
      if (sc.techMaturities === void 0) {
        sc.techMaturities = {};
        if (!sc.acquired) {
          for (const tid of sc.technologies) {
            sc.techMaturities[tid] = 20 + Math.floor(Math.random() * 61);
          }
        }
      }
    }
    const allPools = [...IDEA_TECH_POOL, ...OPEN_SOURCE_TECH_POOL, ...SMALL_COMPANY_TECH_POOL];
    for (const tech of data.acceptedIdeaTechs) {
      if (tech.difficulty === void 0) {
        const match = allPools.find((p) => p.id === tech.id);
        tech.difficulty = match?.difficulty ?? 4;
      }
    }
    for (const model of data.models) {
      if (model.postTraining === void 0) {
        model.postTraining = [];
      }
    }
    for (const key of Object.keys(data.resourceMeta)) {
      const val = data.resourceMeta[key];
      if (val && typeof val === "object" && !Array.isArray(val)) {
        const obj = val;
        const entries = Object.entries(obj);
        if (entries.length > 0 && entries.every(([k]) => /^\d+$/.test(k))) {
          entries.sort(([a], [b]) => Number(a) - Number(b));
          data.resourceMeta[key] = entries.map(([, v]) => v);
        }
      }
    }
    if (data.acceptedIdeaTechs.length > 0) {
      for (const techNode of data.acceptedIdeaTechs) {
        IDEA_TECH_MAP[techNode.id] = techNode;
      }
    }
  }
};

// ../../src/core/config/computeCards.ts
var COMPUTE_CARD_SPECS = [
  // ===== 现有型号（补全新字段） =====
  {
    resourceId: "compute_a100",
    name: "A100 80GB",
    tflopsPerCard: 624,
    powerPerCard: 0.4,
    maxPowerDrawKW: 0.4,
    unitCost: 1e4,
    deliveryDays: 3,
    wearPerDay: 8e-4,
    memoryGB: 80,
    memoryBandwidth: 1935,
    interconnect: "NVLink3",
    nvlinkBandwidth: 600,
    supportsFP8: false,
    supportsFP4: false,
    sparsityAccel: true,
    recommendedRole: "both",
    releaseDate: "2020-05-14"
  },
  {
    resourceId: "compute_h100",
    name: "H100 80GB",
    tflopsPerCard: 1979,
    powerPerCard: 0.7,
    maxPowerDrawKW: 0.7,
    unitCost: 3e4,
    deliveryDays: 7,
    wearPerDay: 5e-4,
    memoryGB: 80,
    memoryBandwidth: 3350,
    interconnect: "NVLink4",
    nvlinkBandwidth: 900,
    fp8Tflops: 3958,
    supportsFP8: true,
    supportsFP4: false,
    sparsityAccel: true,
    recommendedRole: "training",
    releaseDate: "2022-09-20"
  },
  // ===== 新增型号 =====
  {
    resourceId: "compute_a100_40g",
    name: "A100 40GB",
    tflopsPerCard: 312,
    powerPerCard: 0.3,
    maxPowerDrawKW: 0.3,
    unitCost: 6e3,
    deliveryDays: 2,
    wearPerDay: 1e-3,
    memoryGB: 40,
    memoryBandwidth: 1555,
    interconnect: "NVLink3",
    nvlinkBandwidth: 600,
    supportsFP8: false,
    supportsFP4: false,
    sparsityAccel: true,
    recommendedRole: "both",
    releaseDate: "2020-05-14"
  },
  {
    resourceId: "compute_h200",
    name: "H200 141GB",
    tflopsPerCard: 1979,
    powerPerCard: 0.7,
    maxPowerDrawKW: 0.75,
    unitCost: 4e4,
    deliveryDays: 10,
    wearPerDay: 4e-4,
    memoryGB: 141,
    memoryBandwidth: 4800,
    interconnect: "NVLink4",
    nvlinkBandwidth: 900,
    fp8Tflops: 3958,
    supportsFP8: true,
    supportsFP4: false,
    sparsityAccel: true,
    recommendedRole: "training",
    releaseDate: "2024-04-01"
  },
  {
    resourceId: "compute_b200",
    name: "B200 192GB",
    tflopsPerCard: 4500,
    powerPerCard: 1,
    maxPowerDrawKW: 1.2,
    unitCost: 45e3,
    deliveryDays: 14,
    wearPerDay: 3e-4,
    memoryGB: 192,
    memoryBandwidth: 8e3,
    interconnect: "NVLink5",
    nvlinkBandwidth: 1800,
    fp8Tflops: 9e3,
    supportsFP8: true,
    supportsFP4: true,
    sparsityAccel: true,
    recommendedRole: "training",
    releaseDate: "2024-10-01"
  },
  {
    resourceId: "compute_gb200",
    name: "GB200 192GB",
    tflopsPerCard: 5e3,
    powerPerCard: 1.2,
    maxPowerDrawKW: 1.4,
    unitCost: 6e4,
    deliveryDays: 18,
    wearPerDay: 25e-5,
    memoryGB: 192,
    memoryBandwidth: 8e3,
    interconnect: "NVLink5",
    nvlinkBandwidth: 1800,
    fp8Tflops: 1e4,
    supportsFP8: true,
    supportsFP4: true,
    sparsityAccel: true,
    recommendedRole: "training",
    releaseDate: "2024-11-01"
  },
  {
    resourceId: "compute_gb300",
    name: "GB300 288GB",
    tflopsPerCard: 7500,
    powerPerCard: 1.5,
    maxPowerDrawKW: 1.8,
    unitCost: 75e3,
    deliveryDays: 21,
    wearPerDay: 2e-4,
    memoryGB: 288,
    memoryBandwidth: 13e3,
    interconnect: "NVLink6",
    nvlinkBandwidth: 3600,
    fp8Tflops: 15e3,
    supportsFP8: true,
    supportsFP4: true,
    sparsityAccel: true,
    recommendedRole: "training",
    releaseDate: "2025-07-01"
  },
  {
    resourceId: "compute_blackwell_ultra",
    name: "Blackwell Ultra 288GB",
    tflopsPerCard: 9e3,
    powerPerCard: 1.4,
    maxPowerDrawKW: 1.6,
    unitCost: 7e4,
    deliveryDays: 21,
    wearPerDay: 2e-4,
    memoryGB: 288,
    memoryBandwidth: 13e3,
    interconnect: "NVLink6",
    nvlinkBandwidth: 3600,
    fp8Tflops: 18e3,
    supportsFP8: true,
    supportsFP4: true,
    sparsityAccel: true,
    recommendedRole: "training",
    releaseDate: "2026-06-01"
  },
  {
    resourceId: "compute_rubin",
    name: "RUBIN 384GB",
    tflopsPerCard: 12e3,
    powerPerCard: 1.6,
    maxPowerDrawKW: 1.8,
    unitCost: 9e4,
    deliveryDays: 28,
    wearPerDay: 18e-5,
    memoryGB: 384,
    memoryBandwidth: 17e3,
    interconnect: "NVLink7",
    nvlinkBandwidth: 5400,
    fp8Tflops: 24e3,
    supportsFP8: true,
    supportsFP4: true,
    sparsityAccel: true,
    recommendedRole: "training",
    releaseDate: "2026-11-01"
  },
  {
    resourceId: "compute_rubin_ultra",
    name: "RUBIN Ultra 512GB",
    tflopsPerCard: 18e3,
    powerPerCard: 2,
    maxPowerDrawKW: 2.4,
    unitCost: 12e4,
    deliveryDays: 35,
    wearPerDay: 15e-5,
    memoryGB: 512,
    memoryBandwidth: 22e3,
    interconnect: "NVLink7",
    nvlinkBandwidth: 5400,
    fp8Tflops: 36e3,
    supportsFP8: true,
    supportsFP4: true,
    sparsityAccel: true,
    recommendedRole: "training",
    releaseDate: "2027-06-01"
  },
  {
    resourceId: "compute_l40s",
    name: "L40S 48GB",
    tflopsPerCard: 733,
    powerPerCard: 0.3,
    maxPowerDrawKW: 0.35,
    unitCost: 8e3,
    deliveryDays: 3,
    wearPerDay: 6e-4,
    memoryGB: 48,
    memoryBandwidth: 864,
    interconnect: "PCIe5",
    nvlinkBandwidth: 0,
    fp8Tflops: 733,
    supportsFP8: true,
    supportsFP4: false,
    sparsityAccel: false,
    recommendedRole: "inference",
    releaseDate: "2023-08-01"
  }
];
var SPEC_MAP = new Map(COMPUTE_CARD_SPECS.map((s) => [s.resourceId, s]));
function getCardSpec(resourceId) {
  return SPEC_MAP.get(resourceId);
}

// ../../src/core/systems/ComputeHardwareSystem.ts
var ComputeHardwareSystem = class {
  name = "ComputeHardwareSystem";
  specs = /* @__PURE__ */ new Map();
  constructor(_registry) {
    for (const spec of COMPUTE_CARD_SPECS) {
      this.specs.set(spec.resourceId, spec);
    }
  }
  update(state, events, _deltaDays) {
    const current2 = state.read();
    const today = current2.date;
    const dueOrders = current2.pendingOrders.filter((o) => o.deliveryDay <= today);
    if (dueOrders.length > 0) {
      let tflopsGained = 0;
      state.update((draft) => {
        draft.pendingOrders = draft.pendingOrders.filter((o) => o.deliveryDay > today);
        for (const order of dueOrders) {
          const spec = this.specs.get(order.modelId);
          const rawPool = draft.resourceMeta[order.modelId];
          const pool = Array.isArray(rawPool) ? rawPool : [];
          for (let i = 0; i < order.quantity; i++) {
            pool.push({
              uid: `${order.modelId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}`,
              modelId: order.modelId,
              status: "online",
              age: 0,
              assignedProjectId: null,
              purchasedAt: today,
              location: null
            });
          }
          draft.resourceMeta[order.modelId] = pool;
          draft.resources[order.modelId] = (draft.resources[order.modelId] ?? 0) + order.quantity;
          if (spec) {
            const addedTFlops = order.quantity * spec.tflopsPerCard;
            draft.resources["compute_power"] = (draft.resources["compute_power"] ?? 0) + addedTFlops;
            tflopsGained += addedTFlops;
          }
        }
      });
      for (const order of dueOrders) {
        events.emit("HARDWARE_DELIVERED", order.modelId, order.quantity);
      }
      if (tflopsGained > 0) {
        events.emit("COMPUTE_POWER_CHANGED", tflopsGained);
      }
    }
    const rawCloudContracts = current2.resourceMeta["cloud_rental_contracts"];
    const cloudContracts = Array.isArray(rawCloudContracts) ? rawCloudContracts : [];
    const expiredContracts = cloudContracts.filter((c) => c.expiresAt <= today);
    if (expiredContracts.length > 0) {
      let tfopsReleased = 0;
      for (const contract of expiredContracts) {
        tfopsReleased += contract.tflops;
      }
      state.update((draft) => {
        const rawActive = draft.resourceMeta["cloud_rental_contracts"];
        const activeContracts = Array.isArray(rawActive) ? rawActive : [];
        draft.resourceMeta["cloud_rental_contracts"] = activeContracts.filter((c) => c.expiresAt > today);
      });
      for (const contract of expiredContracts) {
        events.emit("CLOUD_RENTAL_EXPIRED", {
          providerId: contract.providerId,
          tflops: contract.tflops,
          contractId: contract.id
        });
      }
    }
  }
  /** 获取某型号当前可用的（在线未分配）卡实例列表 */
  getAvailableCards(state, modelId) {
    const pool = state.getResourceMeta(modelId) ?? [];
    return pool.filter((c) => c.status === "online" && c.assignedProjectId === null);
  }
};

// ../../src/core/config/regions.ts
var REGIONS = [
  // ========================
  // 北美 (5)
  // ========================
  {
    id: "us-west",
    name: "\u7F8E\u56FD\u897F\u6D77\u5CB8",
    country: "\u5408\u4F17\u56FD",
    continent: "\u5317\u7F8E",
    population: 51.2,
    gdpPerCapita: 92e3,
    internetPenetration: 96,
    techAdoption: 10,
    marketEntryDifficulty: 3,
    regulationLevel: 5,
    dataLocalization: false,
    censorshipLevel: 1,
    taxRate: 28,
    talentIndex: 98,
    computeIndex: 95,
    energyCostIndex: 45,
    primaryLanguages: ["en"],
    culturalSensitivity: 2,
    recommendedStart: true,
    startReason: "\u7845\u8C37\u6240\u5728\u5730\uFF0C\u5168\u7403\u9876\u5C16 AI \u4EBA\u624D\u5BC6\u5EA6\u6700\u9AD8\uFF0C\u7B97\u529B\u4F9B\u5E94\u5145\u8DB3\uFF0C\u5E02\u573A\u5F00\u653E\u5EA6\u9AD8"
  },
  {
    id: "us-northeast",
    name: "\u7F8E\u56FD\u4E1C\u5317\u90E8",
    country: "\u5408\u4F17\u56FD",
    continent: "\u5317\u7F8E",
    population: 57.6,
    gdpPerCapita: 85e3,
    internetPenetration: 94,
    techAdoption: 9,
    marketEntryDifficulty: 3,
    regulationLevel: 5,
    dataLocalization: false,
    censorshipLevel: 1,
    taxRate: 28,
    talentIndex: 95,
    computeIndex: 88,
    energyCostIndex: 55,
    primaryLanguages: ["en"],
    culturalSensitivity: 2,
    recommendedStart: true,
    startReason: "\u7EBD\u7EA6+\u6CE2\u58EB\u987F\uFF0C\u91D1\u878D\u8D44\u672C\u96C4\u539A\uFF0CMIT/Harvard \u9876\u7EA7\u5B66\u672F\u8D44\u6E90\uFF0C\u91D1\u878DAI\u5E02\u573A\u5DE8\u5927"
  },
  {
    id: "us-south",
    name: "\u7F8E\u56FD\u5357\u90E8",
    country: "\u5408\u4F17\u56FD",
    continent: "\u5317\u7F8E",
    population: 68.3,
    gdpPerCapita: 62e3,
    internetPenetration: 91,
    techAdoption: 7,
    marketEntryDifficulty: 2,
    regulationLevel: 4,
    dataLocalization: false,
    censorshipLevel: 1,
    taxRate: 21,
    talentIndex: 65,
    computeIndex: 72,
    energyCostIndex: 30,
    primaryLanguages: ["en"],
    culturalSensitivity: 3,
    recommendedStart: false
  },
  {
    id: "us-midwest",
    name: "\u7F8E\u56FD\u4E2D\u897F\u90E8",
    country: "\u5408\u4F17\u56FD",
    continent: "\u5317\u7F8E",
    population: 46.1,
    gdpPerCapita: 58e3,
    internetPenetration: 89,
    techAdoption: 6,
    marketEntryDifficulty: 2,
    regulationLevel: 4,
    dataLocalization: false,
    censorshipLevel: 1,
    taxRate: 25,
    talentIndex: 60,
    computeIndex: 60,
    energyCostIndex: 35,
    primaryLanguages: ["en"],
    culturalSensitivity: 3,
    recommendedStart: false
  },
  {
    id: "ca",
    name: "\u52A0\u62FF\u5927",
    country: "\u52A0\u62FF\u5927",
    continent: "\u5317\u7F8E",
    population: 39.5,
    gdpPerCapita: 55e3,
    internetPenetration: 95,
    techAdoption: 8,
    marketEntryDifficulty: 3,
    regulationLevel: 6,
    dataLocalization: true,
    censorshipLevel: 2,
    taxRate: 26,
    talentIndex: 80,
    computeIndex: 65,
    energyCostIndex: 20,
    primaryLanguages: ["en", "fr"],
    culturalSensitivity: 3,
    recommendedStart: false
  },
  // ========================
  // 东亚 (7)
  // ========================
  {
    id: "cn-east",
    name: "\u4E2D\u56FD\u957F\u4E09\u89D2",
    country: "\u5171\u548C\u56FD",
    continent: "\u4E1C\u4E9A",
    population: 175.2,
    gdpPerCapita: 24e3,
    internetPenetration: 92,
    techAdoption: 9,
    marketEntryDifficulty: 6,
    regulationLevel: 8,
    dataLocalization: true,
    censorshipLevel: 8,
    taxRate: 25,
    talentIndex: 88,
    computeIndex: 70,
    energyCostIndex: 40,
    primaryLanguages: ["zh-CN"],
    culturalSensitivity: 5,
    recommendedStart: true,
    startReason: "\u4E0A\u6D77+\u676D\u5DDE+\u82CF\u5DDE\uFF0C\u4E2D\u56FD\u6700\u5927\u7ECF\u6D4E\u4F53\u91CF\uFF0C\u4E92\u8054\u7F51\u4EA7\u4E1A\u6210\u719F\uFF0C\u7528\u6237\u57FA\u6570\u6781\u5927"
  },
  {
    id: "cn-south",
    name: "\u4E2D\u56FD\u73E0\u4E09\u89D2",
    country: "\u5171\u548C\u56FD",
    continent: "\u4E1C\u4E9A",
    population: 86.2,
    gdpPerCapita: 22500,
    internetPenetration: 95,
    techAdoption: 9,
    marketEntryDifficulty: 6,
    regulationLevel: 8,
    dataLocalization: true,
    censorshipLevel: 8,
    taxRate: 25,
    talentIndex: 85,
    computeIndex: 75,
    energyCostIndex: 38,
    primaryLanguages: ["zh-CN"],
    culturalSensitivity: 5,
    recommendedStart: true,
    startReason: "\u6DF1\u5733+\u5E7F\u5DDE\uFF0C\u786C\u4EF6\u4EA7\u4E1A\u94FE\u5B8C\u5584\uFF0C\u534E\u4E3A/\u817E\u8BAF\u603B\u90E8\u6240\u5728\uFF0C\u7B97\u529B\u786C\u4EF6\u4F18\u52BF\u660E\u663E"
  },
  {
    id: "cn-north",
    name: "\u4E2D\u56FD\u4EAC\u6D25\u5180",
    country: "\u5171\u548C\u56FD",
    continent: "\u4E1C\u4E9A",
    population: 112.4,
    gdpPerCapita: 19e3,
    internetPenetration: 88,
    techAdoption: 8,
    marketEntryDifficulty: 7,
    regulationLevel: 9,
    dataLocalization: true,
    censorshipLevel: 9,
    taxRate: 25,
    talentIndex: 90,
    computeIndex: 65,
    energyCostIndex: 50,
    primaryLanguages: ["zh-CN"],
    culturalSensitivity: 5,
    recommendedStart: true,
    startReason: "\u5317\u4EAC+\u5929\u6D25\uFF0C\u4E2D\u56FD\u653F\u7B56\u4E2D\u5FC3+\u79D1\u7814\u91CD\u9547\uFF0C\u6E05\u534E\u5317\u5927\u9876\u7EA7\u9AD8\u6821\uFF0CAI \u8BBA\u6587\u4EA7\u51FA\u5168\u7403\u9886\u5148"
  },
  {
    id: "cn-inland",
    name: "\u4E2D\u56FD\u5185\u9646",
    country: "\u5171\u548C\u56FD",
    continent: "\u4E1C\u4E9A",
    population: 435.6,
    gdpPerCapita: 11e3,
    internetPenetration: 76,
    techAdoption: 6,
    marketEntryDifficulty: 5,
    regulationLevel: 8,
    dataLocalization: true,
    censorshipLevel: 8,
    taxRate: 25,
    talentIndex: 55,
    computeIndex: 45,
    energyCostIndex: 42,
    primaryLanguages: ["zh-CN"],
    culturalSensitivity: 4,
    recommendedStart: false
  },
  {
    id: "jp",
    name: "\u65E5\u672C",
    country: "\u65E5\u672C",
    continent: "\u4E1C\u4E9A",
    population: 123.5,
    gdpPerCapita: 35e3,
    internetPenetration: 93,
    techAdoption: 7,
    marketEntryDifficulty: 5,
    regulationLevel: 5,
    dataLocalization: false,
    censorshipLevel: 3,
    taxRate: 30,
    talentIndex: 82,
    computeIndex: 72,
    energyCostIndex: 85,
    primaryLanguages: ["ja"],
    culturalSensitivity: 8,
    recommendedStart: true,
    startReason: "\u9AD8\u6D88\u8D39\u529B\u5E02\u573A\uFF0C\u4ED8\u8D39\u610F\u613F\u5F3A\uFF0C\u4F01\u4E1AAI\u9700\u6C42\u65FA\u76DB\uFF0C\u4F46\u8BED\u8A00\u58C1\u5792\u9AD8"
  },
  {
    id: "kr",
    name: "\u97E9\u56FD",
    country: "\u97E9\u56FD",
    continent: "\u4E1C\u4E9A",
    population: 51.7,
    gdpPerCapita: 34e3,
    internetPenetration: 97,
    techAdoption: 9,
    marketEntryDifficulty: 4,
    regulationLevel: 5,
    dataLocalization: true,
    censorshipLevel: 5,
    taxRate: 27,
    talentIndex: 78,
    computeIndex: 70,
    energyCostIndex: 70,
    primaryLanguages: ["ko"],
    culturalSensitivity: 7,
    recommendedStart: false
  },
  {
    id: "tw",
    name: "\u4E2D\u56FD\u53F0\u6E7E",
    country: "\u4E2D\u56FD\u53F0\u6E7E",
    continent: "\u4E1C\u4E9A",
    population: 23.4,
    gdpPerCapita: 33e3,
    internetPenetration: 92,
    techAdoption: 8,
    marketEntryDifficulty: 4,
    regulationLevel: 4,
    dataLocalization: false,
    censorshipLevel: 2,
    taxRate: 20,
    talentIndex: 78,
    computeIndex: 85,
    energyCostIndex: 65,
    primaryLanguages: ["zh-TW"],
    culturalSensitivity: 4,
    recommendedStart: false
  },
  // ========================
  // 东南亚 (3)
  // ========================
  {
    id: "sg",
    name: "\u65B0\u52A0\u5761",
    country: "\u65B0\u52A0\u5761",
    continent: "\u4E1C\u5357\u4E9A",
    population: 5.9,
    gdpPerCapita: 85e3,
    internetPenetration: 98,
    techAdoption: 9,
    marketEntryDifficulty: 2,
    regulationLevel: 5,
    dataLocalization: false,
    censorshipLevel: 4,
    taxRate: 17,
    talentIndex: 72,
    computeIndex: 80,
    energyCostIndex: 75,
    primaryLanguages: ["en", "zh-CN", "ms"],
    culturalSensitivity: 4,
    recommendedStart: false
  },
  {
    id: "indo-china",
    name: "\u4E2D\u5357\u534A\u5C9B",
    country: "\u8D8A/\u6CF0/\u7F05/\u67EC/\u8001",
    continent: "\u4E1C\u5357\u4E9A",
    population: 252.4,
    gdpPerCapita: 6500,
    internetPenetration: 70,
    techAdoption: 6,
    marketEntryDifficulty: 5,
    regulationLevel: 4,
    dataLocalization: false,
    censorshipLevel: 5,
    taxRate: 22,
    talentIndex: 30,
    computeIndex: 30,
    energyCostIndex: 52,
    primaryLanguages: ["vi", "th", "en"],
    culturalSensitivity: 7,
    recommendedStart: false
  },
  {
    id: "malay",
    name: "\u9A6C\u6765\u7FA4\u5C9B",
    country: "\u5370\u5C3C/\u9A6C\u6765/\u83F2\u5F8B\u5BBE/\u6587\u83B1",
    continent: "\u4E1C\u5357\u4E9A",
    population: 431.8,
    gdpPerCapita: 5500,
    internetPenetration: 74,
    techAdoption: 6,
    marketEntryDifficulty: 4,
    regulationLevel: 4,
    dataLocalization: false,
    censorshipLevel: 4,
    taxRate: 22,
    talentIndex: 32,
    computeIndex: 32,
    energyCostIndex: 56,
    primaryLanguages: ["id", "ms", "tl", "en"],
    culturalSensitivity: 7,
    recommendedStart: false
  },
  // ========================
  // 南亚 (2)
  // ========================
  {
    id: "in",
    name: "\u5370\u5EA6",
    country: "\u5370\u5EA6",
    continent: "\u5357\u4E9A",
    population: 1441.7,
    gdpPerCapita: 2800,
    internetPenetration: 55,
    techAdoption: 6,
    marketEntryDifficulty: 4,
    regulationLevel: 5,
    dataLocalization: true,
    censorshipLevel: 5,
    taxRate: 30,
    talentIndex: 72,
    computeIndex: 40,
    energyCostIndex: 50,
    primaryLanguages: ["hi", "en", "bn", "ta"],
    culturalSensitivity: 8,
    recommendedStart: false
  },
  {
    id: "sa-other",
    name: "\u5357\u4E9A\u5176\u4ED6",
    country: "\u5357\u4E9A\u5404\u56FD",
    continent: "\u5357\u4E9A",
    population: 472.8,
    gdpPerCapita: 1800,
    internetPenetration: 38,
    techAdoption: 3,
    marketEntryDifficulty: 5,
    regulationLevel: 4,
    dataLocalization: false,
    censorshipLevel: 5,
    taxRate: 28,
    talentIndex: 18,
    computeIndex: 18,
    energyCostIndex: 60,
    primaryLanguages: ["bn", "en", "hi"],
    culturalSensitivity: 7,
    recommendedStart: false
  },
  // ========================
  // 欧洲 (7)
  // ========================
  {
    id: "uk",
    name: "\u82F1\u56FD\u4E0E\u7231\u5C14\u5170",
    country: "\u82F1\u56FD/\u7231\u5C14\u5170",
    continent: "\u6B27\u6D32",
    population: 72.5,
    gdpPerCapita: 48e3,
    internetPenetration: 96,
    techAdoption: 8,
    marketEntryDifficulty: 4,
    regulationLevel: 6,
    dataLocalization: false,
    censorshipLevel: 2,
    taxRate: 25,
    talentIndex: 85,
    computeIndex: 72,
    energyCostIndex: 60,
    primaryLanguages: ["en", "en-GB"],
    culturalSensitivity: 2,
    recommendedStart: true,
    startReason: "DeepMine \u53D1\u6E90\u5730\uFF0CAI \u7814\u7A76\u5E95\u8574\u6DF1\u539A\uFF0C\u82F1\u8BED\u6BCD\u8BED\u5E02\u573A\uFF0C\u8131\u6B27\u540E\u76D1\u7BA1\u76F8\u5BF9\u72EC\u7ACB"
  },
  {
    id: "fr",
    name: "\u6CD5\u56FD\u4E0E\u4F4E\u5730",
    country: "\u6CD5\u56FD/\u6BD4/\u8377/\u5362",
    continent: "\u6B27\u6D32",
    population: 98.3,
    gdpPerCapita: 48e3,
    internetPenetration: 93,
    techAdoption: 7,
    marketEntryDifficulty: 5,
    regulationLevel: 8,
    dataLocalization: false,
    censorshipLevel: 3,
    taxRate: 28,
    talentIndex: 78,
    computeIndex: 65,
    energyCostIndex: 50,
    primaryLanguages: ["fr", "nl", "en"],
    culturalSensitivity: 6,
    recommendedStart: true,
    startReason: "Mistral AI \u53D1\u6E90\u5730+\u5DF4\u9ECE\u9876\u5C16\u6570\u5B66\u4EBA\u624D\uFF0CEU AI Act \u603B\u90E8\u6240\u5728\u5730\uFF0C\u4F4E\u5730\u56FD\u5BB6\u82F1\u8BED\u666E\u53CA\u7387\u9AD8"
  },
  {
    id: "de",
    name: "\u5FB7\u56FD",
    country: "\u5FB7\u56FD/\u5965\u5730\u5229/\u745E\u58EB",
    continent: "\u6B27\u6D32",
    population: 102.1,
    gdpPerCapita: 55e3,
    internetPenetration: 95,
    techAdoption: 7,
    marketEntryDifficulty: 5,
    regulationLevel: 7,
    dataLocalization: false,
    censorshipLevel: 3,
    taxRate: 30,
    talentIndex: 82,
    computeIndex: 68,
    energyCostIndex: 55,
    primaryLanguages: ["de", "en"],
    culturalSensitivity: 5,
    recommendedStart: false
  },
  {
    id: "iberia",
    name: "\u4F0A\u6BD4\u5229\u4E9A\u534A\u5C9B",
    country: "\u897F\u73ED\u7259/\u8461\u8404\u7259",
    continent: "\u6B27\u6D32",
    population: 58.2,
    gdpPerCapita: 32e3,
    internetPenetration: 91,
    techAdoption: 6,
    marketEntryDifficulty: 4,
    regulationLevel: 5,
    dataLocalization: false,
    censorshipLevel: 2,
    taxRate: 25,
    talentIndex: 50,
    computeIndex: 45,
    energyCostIndex: 52,
    primaryLanguages: ["es", "pt"],
    culturalSensitivity: 4,
    recommendedStart: false
  },
  {
    id: "eu-north",
    name: "\u5317\u6B27",
    country: "\u745E\u5178/\u632A\u5A01/\u4E39\u9EA6/\u82AC\u5170",
    continent: "\u6B27\u6D32",
    population: 27.5,
    gdpPerCapita: 62e3,
    internetPenetration: 97,
    techAdoption: 9,
    marketEntryDifficulty: 3,
    regulationLevel: 6,
    dataLocalization: false,
    censorshipLevel: 1,
    taxRate: 22,
    talentIndex: 75,
    computeIndex: 62,
    energyCostIndex: 15,
    primaryLanguages: ["sv", "da", "no", "fi", "en"],
    culturalSensitivity: 4,
    recommendedStart: false
  },
  {
    id: "eu-south",
    name: "\u5357\u6B27",
    country: "\u610F\u5927\u5229/\u5E0C\u814A",
    continent: "\u6B27\u6D32",
    population: 68.5,
    gdpPerCapita: 33e3,
    internetPenetration: 87,
    techAdoption: 6,
    marketEntryDifficulty: 4,
    regulationLevel: 5,
    dataLocalization: false,
    censorshipLevel: 2,
    taxRate: 27,
    talentIndex: 52,
    computeIndex: 48,
    energyCostIndex: 60,
    primaryLanguages: ["it"],
    culturalSensitivity: 5,
    recommendedStart: false
  },
  {
    id: "eu-east",
    name: "\u4E2D\u4E1C\u6B27",
    country: "\u6CE2\u5170/\u6377\u514B/\u7F57\u9A6C\u5C3C\u4E9A\u7B49",
    continent: "\u6B27\u6D32",
    population: 95.3,
    gdpPerCapita: 18500,
    internetPenetration: 82,
    techAdoption: 5,
    marketEntryDifficulty: 3,
    regulationLevel: 4,
    dataLocalization: false,
    censorshipLevel: 3,
    taxRate: 19,
    talentIndex: 48,
    computeIndex: 38,
    energyCostIndex: 48,
    primaryLanguages: ["en", "de"],
    culturalSensitivity: 5,
    recommendedStart: false
  },
  // ========================
  // 中东与北非 (4)
  // ========================
  {
    id: "il",
    name: "\u4EE5\u8272\u5217",
    country: "\u4EE5\u8272\u5217",
    continent: "\u4E2D\u4E1C",
    population: 9.7,
    gdpPerCapita: 55e3,
    internetPenetration: 95,
    techAdoption: 9,
    marketEntryDifficulty: 4,
    regulationLevel: 5,
    dataLocalization: true,
    censorshipLevel: 4,
    taxRate: 23,
    talentIndex: 78,
    computeIndex: 72,
    energyCostIndex: 55,
    primaryLanguages: ["he", "ar", "en"],
    culturalSensitivity: 5,
    recommendedStart: false
  },
  {
    id: "sa",
    name: "\u6C99\u7279\u4E0E\u6D77\u6E7E",
    country: "\u6C99\u7279/\u963F\u8054\u914B/\u5361\u5854\u5C14/\u79D1\u5A01\u7279",
    continent: "\u4E2D\u4E1C",
    population: 45.1,
    gdpPerCapita: 38e3,
    internetPenetration: 88,
    techAdoption: 7,
    marketEntryDifficulty: 5,
    regulationLevel: 6,
    dataLocalization: true,
    censorshipLevel: 7,
    taxRate: 15,
    talentIndex: 28,
    computeIndex: 50,
    energyCostIndex: 12,
    primaryLanguages: ["ar", "en"],
    culturalSensitivity: 8,
    recommendedStart: false
  },
  {
    id: "me-other",
    name: "\u4E2D\u4E1C\u5176\u4ED6",
    country: "\u4F0A\u6717/\u4F0A\u62C9\u514B/\u7EA6\u65E6/\u53D9\u5229\u4E9A\u7B49",
    continent: "\u4E2D\u4E1C",
    population: 74.2,
    gdpPerCapita: 7500,
    internetPenetration: 62,
    techAdoption: 3,
    marketEntryDifficulty: 7,
    regulationLevel: 7,
    dataLocalization: true,
    censorshipLevel: 8,
    taxRate: 25,
    talentIndex: 18,
    computeIndex: 18,
    energyCostIndex: 25,
    primaryLanguages: ["ar", "tr"],
    culturalSensitivity: 8,
    recommendedStart: false
  },
  {
    id: "naf",
    name: "\u5317\u975E",
    country: "\u57C3\u53CA/\u6469\u6D1B\u54E5/\u963F\u5C14\u53CA\u5229\u4E9A/\u7A81\u5C3C\u65AF",
    continent: "\u4E2D\u4E1C",
    population: 216.3,
    gdpPerCapita: 4800,
    internetPenetration: 55,
    techAdoption: 3,
    marketEntryDifficulty: 5,
    regulationLevel: 4,
    dataLocalization: false,
    censorshipLevel: 6,
    taxRate: 25,
    talentIndex: 15,
    computeIndex: 15,
    energyCostIndex: 42,
    primaryLanguages: ["ar", "fr"],
    culturalSensitivity: 7,
    recommendedStart: false
  },
  // ========================
  // 拉美 (2)
  // ========================
  {
    id: "br",
    name: "\u5DF4\u897F",
    country: "\u5DF4\u897F",
    continent: "\u5357\u7F8E",
    population: 215.3,
    gdpPerCapita: 9500,
    internetPenetration: 80,
    techAdoption: 6,
    marketEntryDifficulty: 6,
    regulationLevel: 6,
    dataLocalization: true,
    censorshipLevel: 4,
    taxRate: 34,
    talentIndex: 40,
    computeIndex: 30,
    energyCostIndex: 48,
    primaryLanguages: ["pt-BR"],
    culturalSensitivity: 6,
    recommendedStart: false
  },
  {
    id: "hispanic",
    name: "\u897F\u8BED\u7F8E\u6D32",
    country: "\u58A8\u897F\u54E5/\u963F\u6839\u5EF7/\u667A\u5229/\u54E5\u4F26\u6BD4\u4E9A\u7B49",
    continent: "\u5357\u7F8E",
    population: 324.6,
    gdpPerCapita: 10200,
    internetPenetration: 71,
    techAdoption: 5,
    marketEntryDifficulty: 5,
    regulationLevel: 4,
    dataLocalization: false,
    censorshipLevel: 3,
    taxRate: 30,
    talentIndex: 30,
    computeIndex: 25,
    energyCostIndex: 45,
    primaryLanguages: ["es", "en"],
    culturalSensitivity: 5,
    recommendedStart: false
  },
  // ========================
  // 欧亚 (1)
  // ========================
  {
    id: "ru",
    name: "\u4FC4\u7F57\u65AF\u4E0E\u72EC\u8054\u4F53",
    country: "\u4FC4\u7F57\u65AF/\u54C8\u8428\u514B\u65AF\u5766\u7B49",
    continent: "\u6B27\u4E9A",
    population: 210.5,
    gdpPerCapita: 12e3,
    internetPenetration: 82,
    techAdoption: 5,
    marketEntryDifficulty: 7,
    regulationLevel: 7,
    dataLocalization: true,
    censorshipLevel: 7,
    taxRate: 20,
    talentIndex: 55,
    computeIndex: 30,
    energyCostIndex: 18,
    primaryLanguages: ["ru"],
    culturalSensitivity: 6,
    recommendedStart: false
  },
  // ========================
  // 大洋洲 (1)
  // ========================
  {
    id: "oce",
    name: "\u6FB3\u65B0",
    country: "\u6FB3\u5927\u5229\u4E9A/\u65B0\u897F\u5170",
    continent: "\u5927\u6D0B\u6D32",
    population: 31.2,
    gdpPerCapita: 58e3,
    internetPenetration: 92,
    techAdoption: 7,
    marketEntryDifficulty: 3,
    regulationLevel: 5,
    dataLocalization: false,
    censorshipLevel: 2,
    taxRate: 30,
    talentIndex: 65,
    computeIndex: 55,
    energyCostIndex: 45,
    primaryLanguages: ["en"],
    culturalSensitivity: 2,
    recommendedStart: false
  },
  // ========================
  // 非洲 (1) — 撒哈拉以南
  // ========================
  {
    id: "af",
    name: "\u6492\u54C8\u62C9\u4EE5\u5357\u975E\u6D32",
    country: "\u975E\u6D32\u8054\u76DF",
    continent: "\u975E\u6D32",
    population: 1211.2,
    gdpPerCapita: 1800,
    internetPenetration: 30,
    techAdoption: 2,
    marketEntryDifficulty: 6,
    regulationLevel: 3,
    dataLocalization: false,
    censorshipLevel: 5,
    taxRate: 30,
    talentIndex: 8,
    computeIndex: 8,
    energyCostIndex: 58,
    primaryLanguages: ["en", "fr", "sw"],
    culturalSensitivity: 7,
    recommendedStart: false
  }
];
var REGION_MAP = Object.fromEntries(
  REGIONS.map((r) => [r.id, r])
);
var RECOMMENDED_START_REGIONS = REGIONS.filter((r) => r.recommendedStart);
function getGridPowerPrice(region) {
  return Math.round(400 + region.energyCostIndex / 100 * 1600);
}
function getGridPowerCap(region) {
  const devFactor = region.internetPenetration / 100;
  return Math.round(region.population * 30 * devFactor);
}

// ../../src/core/systems/RegionSystem.ts
var RegionSystem = class {
  name = "RegionSystem";
  update(state, events, _deltaDays) {
    const current2 = state.read();
    if (!current2.headquartersRegionId) return;
    const hq = REGION_MAP[current2.headquartersRegionId];
    if (!hq) return;
    const modifiers = getRegionModifiers(current2.headquartersRegionId);
    if (current2.operations && current2.operations.dailyRevenue > 0) {
      const ops = current2.operations;
      const estimatedPowerCost = current2.lastDayPowerCostDate === current2.date ? current2.lastDayPowerCost : 0;
      const totalNonPowerCost = current2.serverNodes.reduce((s, n) => s + n.maintenanceCost, 0) + current2.clusters.reduce((s, c) => s + c.operationalCostPerDay + c.storageCostPerDay, 0) + current2.dataCenters.reduce((s, dc) => s + dc.maintenanceCostPerDay, 0);
      const totalDailyRevenue = ops.dailyRevenue + (ops.tokenRevenue ?? 0);
      const dailyProfit = Math.max(0, totalDailyRevenue - estimatedPowerCost - totalNonPowerCost);
      const taxAmount = dailyProfit * modifiers.taxRate;
      if (taxAmount > 0) {
        state.update((draft) => {
          draft.resources["funds"] = Math.max(0, (draft.resources["funds"] ?? 0) - taxAmount);
        });
      }
    }
    if (current2.riskState.reputation < 20) {
      events.emit("REGULATORY_SCRUTINY", current2.headquartersRegionId);
    }
  }
};
function getRegionModifiers(regionId) {
  const region = regionId ? REGION_MAP[regionId] : null;
  if (!region) {
    return {
      taxRate: 0.25,
      talentBonus: 0,
      energyMultiplier: 1,
      hiringCostMultiplier: 1
    };
  }
  return {
    /** 企业税率（小数） */
    taxRate: region.taxRate / 100,
    /** 人才修正（-0.5 ~ +0.5） */
    talentBonus: (region.talentIndex - 50) / 100,
    /** 能源成本乘数（基准 × energyIndex/50） */
    energyMultiplier: region.energyCostIndex / 50,
    /** 招募成本乘数（高人才地区更贵） */
    hiringCostMultiplier: 0.5 + region.talentIndex / 100 * 0.5
  };
}

// ../../src/core/systems/PowerSystem.ts
var PowerSystem = class {
  name = "PowerSystem";
  registry;
  specs = /* @__PURE__ */ new Map();
  constructor(registry) {
    this.registry = registry;
    for (const spec of COMPUTE_CARD_SPECS) {
      this.specs.set(spec.resourceId, spec);
    }
  }
  update(state, events, deltaDays) {
    if (deltaDays <= 0) return;
    const hardwareDefs = this.registry.getByCategory("hardware");
    let itPowerKW = 0;
    const current2 = state.read();
    for (const def of hardwareDefs) {
      const spec = this.specs.get(def.id);
      if (!spec) continue;
      const pool = current2.resourceMeta[def.id] ?? [];
      if (!Array.isArray(pool)) continue;
      const onlineCount = pool.filter((c) => c.status === "online").length;
      itPowerKW += onlineCount * spec.powerPerCard;
    }
    const capacityKW = current2.resources["power_kw"] ?? 0;
    const excessKW = Math.max(0, itPowerKW - capacityKW);
    if (itPowerKW > 0) {
      const regionMods = getRegionModifiers(current2.headquartersRegionId);
      const marketPricePerKWh = POWER_CONFIG.pricePerKWh * regionMods.energyMultiplier;
      let totalWeight = 0;
      let weightedPriceSum = 0;
      for (const dc of current2.dataCenters) {
        const weight = dc.maxPowerMW;
        totalWeight += weight;
        weightedPriceSum += dc.powerCostPerKWh * weight;
      }
      const dcPricePerKWh = totalWeight > 0 ? weightedPriceSum / totalWeight : marketPricePerKWh;
      const coveredKW = Math.min(itPowerKW, capacityKW);
      const uncoveredKW = Math.max(0, itPowerKW - capacityKW);
      const coveredCost = coveredKW * 24 * dcPricePerKWh * deltaDays;
      const gridCost = uncoveredKW * 24 * marketPricePerKWh * deltaDays;
      const totalPowerCost = coveredCost + gridCost;
      state.addResource("funds", -totalPowerCost);
      state.update((draft) => {
        if (draft.lastDayPowerCostDate !== current2.date) {
          draft.lastDayPowerCostDate = current2.date;
          draft.lastDayPowerCost = 0;
        }
        draft.lastDayPowerCost += totalPowerCost;
      });
      if (uncoveredKW > 0) {
        events.emit("GRID_PURCHASE", {
          consumptionKW: itPowerKW,
          capacityKW,
          excessKW: uncoveredKW,
          marketPricePerKWh,
          dailyCost: gridCost / deltaDays,
          deltaDays
        });
      }
    }
    events.emit("POWER_BALANCE", {
      consumptionKW: itPowerKW,
      capacityKW,
      shortage: false,
      // 不再有硬性停电
      excessKW,
      deltaDays
    });
  }
};

// ../../src/core/config/employees.ts
var ROLE_CONFIG = {
  ["researcher" /* RESEARCHER */]: {
    displayName: "\u7814\u7A76\u5458",
    baseSalary: 18e4,
    attributeWeights: { intelligence: 0.4, creativity: 0.3, stamina: 0.15, leadership: 0.1, charisma: 0.05 },
    skillPool: ["reduce_training_compute", "increase_model_cap", "research_breakthrough"]
  },
  ["data_engineer" /* DATA_ENGINEER */]: {
    displayName: "\u6570\u636E\u5DE5\u7A0B\u5E08",
    baseSalary: 14e4,
    attributeWeights: { intelligence: 0.35, stamina: 0.3, creativity: 0.2, leadership: 0.1, charisma: 0.05 },
    skillPool: ["data_quality_boost", "pipeline_optimization"]
  },
  ["system_engineer" /* SYSTEM_ENGINEER */]: {
    displayName: "\u7CFB\u7EDF\u5DE5\u7A0B\u5E08",
    baseSalary: 13e4,
    attributeWeights: { intelligence: 0.3, stamina: 0.3, leadership: 0.15, creativity: 0.15, charisma: 0.1 },
    skillPool: ["infra_efficiency", "reduce_card_wear"]
  },
  ["product_manager" /* PRODUCT_MANAGER */]: {
    displayName: "\u4EA7\u54C1\u7ECF\u7406",
    baseSalary: 12e4,
    attributeWeights: { leadership: 0.35, charisma: 0.3, intelligence: 0.2, creativity: 0.1, stamina: 0.05 },
    skillPool: ["market_insight", "team_coordination"]
  },
  ["legal_pr" /* LEGAL_PR */]: {
    displayName: "\u6CD5\u52A1/\u516C\u5173",
    baseSalary: 11e4,
    attributeWeights: { charisma: 0.4, intelligence: 0.25, leadership: 0.2, stamina: 0.1, creativity: 0.05 },
    skillPool: ["crisis_management", "compliance_boost"]
  },
  ["manager" /* MANAGER */]: {
    displayName: "\u7BA1\u7406\u4EBA\u5458",
    baseSalary: 26e4,
    attributeWeights: { leadership: 0.45, charisma: 0.25, intelligence: 0.15, stamina: 0.1, creativity: 0.05 },
    skillPool: ["executive_vision", "cost_optimization", "talent_development", "team_coordination"]
  }
};
var SKILL_CONFIG = {
  reduce_training_compute: {
    id: "reduce_training_compute",
    name: "\u7B97\u529B\u4F18\u5316",
    description: "\u8BAD\u7EC3\u6D88\u8017\u7B97\u529B\u51CF\u5C11 5%",
    effect: { type: "reduce_training_compute", value: 0.05 },
    cost: 1
  },
  increase_model_cap: {
    id: "increase_model_cap",
    name: "\u6A21\u578B\u5BB9\u91CF\u6269\u5C55",
    description: "\u53EF\u540C\u65F6\u8BAD\u7EC3\u7684\u6A21\u578B\u6570 +1",
    effect: { type: "increase_model_cap", value: 1 },
    cost: 2
  },
  research_breakthrough: {
    id: "research_breakthrough",
    name: "\u7814\u7A76\u7A81\u7834",
    description: "\u7814\u7A76\u901F\u5EA6 +10%",
    effect: { type: "research_speed", value: 0.1 },
    cost: 2
  },
  data_quality_boost: {
    id: "data_quality_boost",
    name: "\u6570\u636E\u8D28\u91CF\u63D0\u5347",
    description: "\u8BAD\u7EC3\u6570\u636E\u8D28\u91CF +8%",
    effect: { type: "data_quality", value: 0.08 },
    cost: 1
  },
  pipeline_optimization: {
    id: "pipeline_optimization",
    name: "\u6D41\u6C34\u7EBF\u4F18\u5316",
    description: "\u6570\u636E\u5904\u7406\u901F\u5EA6 +15%",
    effect: { type: "data_speed", value: 0.15 },
    cost: 1
  },
  infra_efficiency: {
    id: "infra_efficiency",
    name: "\u57FA\u7840\u8BBE\u65BD\u6548\u7387",
    description: "\u7535\u529B\u6D88\u8017 -5%",
    effect: { type: "reduce_power_consumption", value: 0.05 },
    cost: 1
  },
  reduce_card_wear: {
    id: "reduce_card_wear",
    name: "\u786C\u4EF6\u4FDD\u517B",
    description: "\u8BA1\u7B97\u5361\u6545\u969C\u7387 -20%",
    effect: { type: "reduce_card_wear", value: 0.2 },
    cost: 2
  },
  market_insight: {
    id: "market_insight",
    name: "\u5E02\u573A\u6D1E\u5BDF",
    description: "\u6A21\u578B\u5546\u4E1A\u5316\u6536\u5165 +10%",
    effect: { type: "revenue_boost", value: 0.1 },
    cost: 2
  },
  team_coordination: {
    id: "team_coordination",
    name: "\u56E2\u961F\u534F\u8C03",
    description: "\u56E2\u961F\u6574\u4F53\u6548\u7387 +5%",
    effect: { type: "team_efficiency", value: 0.05 },
    cost: 1
  },
  crisis_management: {
    id: "crisis_management",
    name: "\u5371\u673A\u7BA1\u7406",
    description: "\u8D1F\u9762\u4E8B\u4EF6\u5F71\u54CD -30%",
    effect: { type: "crisis_reduction", value: 0.3 },
    cost: 2
  },
  compliance_boost: {
    id: "compliance_boost",
    name: "\u5408\u89C4\u589E\u76CA",
    description: "\u5408\u89C4\u5EA6 +15",
    effect: { type: "compliance", value: 15 },
    cost: 1
  },
  // ===== 管理人员专属技能 =====
  executive_vision: {
    id: "executive_vision",
    name: "\u6218\u7565\u89C6\u91CE",
    description: "\u516C\u53F8\u7BA1\u7406\u6548\u7387 +2%\uFF08\u591A\u4E2A manager \u89E3\u9501\u53EF\u53E0\u52A0\uFF09",
    effect: { type: "management_efficiency", value: 0.02 },
    cost: 2
  },
  cost_optimization: {
    id: "cost_optimization",
    name: "\u6210\u672C\u4F18\u5316",
    description: "\u5168\u516C\u53F8\u85AA\u8D44\u652F\u51FA -3%\uFF08\u591A\u4E2A\u89E3\u9501\u53EF\u53E0\u52A0\uFF09",
    effect: { type: "salary_reduction", value: 0.03 },
    cost: 2
  },
  talent_development: {
    id: "talent_development",
    name: "\u4EBA\u624D\u53D1\u5C55",
    description: "\u5458\u5DE5\u57F9\u8BAD\u901F\u5EA6 +10%\uFF08\u591A\u4E2A\u89E3\u9501\u53EF\u53E0\u52A0\uFF09",
    effect: { type: "training_speed", value: 0.1 },
    cost: 1
  }
};
var NORMAL_HIRE_COST = 3e3;
var CORE_EMPLOYEE_CAP_PER_ROLE = 10;
var PAY_PERIOD_DAYS = 30;
function experienceForLevel(level) {
  return 100 * level * level;
}
var LEVEL_UP_ATTRIBUTE_GAIN = 3;
var LEVEL_UP_SKILL_POINTS = 1;
var ROLE_TO_STAFF_RESOURCE = {
  ["researcher" /* RESEARCHER */]: "staff_researcher",
  ["data_engineer" /* DATA_ENGINEER */]: "staff_data_engineer",
  ["system_engineer" /* SYSTEM_ENGINEER */]: "staff_system_engineer",
  ["product_manager" /* PRODUCT_MANAGER */]: "staff_product_manager",
  ["legal_pr" /* LEGAL_PR */]: "staff_legal_pr",
  ["manager" /* MANAGER */]: "staff_manager"
};
var RECRUITMENT_CHANNELS = {
  campus: {
    id: "campus",
    name: "\u6821\u56ED\u62DB\u8058",
    cost: 5e3,
    deliveryDays: 14,
    baseAttribute: 55,
    levelRange: [1, 2],
    candidateCount: 3
  },
  job_site: {
    id: "job_site",
    name: "\u62DB\u8058\u7F51\u7AD9",
    cost: 1e4,
    deliveryDays: 3,
    baseAttribute: 65,
    levelRange: [2, 4],
    candidateCount: 3
  },
  headhunter: {
    id: "headhunter",
    name: "\u730E\u5934",
    cost: 5e4,
    deliveryDays: 7,
    baseAttribute: 80,
    levelRange: [4, 7],
    candidateCount: 3
  },
  internal_promote: {
    id: "internal_promote",
    name: "\u5185\u90E8\u664B\u5347",
    cost: 0,
    deliveryDays: 0,
    baseAttribute: 0,
    // 内部晋升使用员工原属性
    levelRange: [1, 10],
    candidateCount: 0
    // 内部晋升不生成候选人
  },
  executive_search: {
    id: "executive_search",
    name: "\u9AD8\u7BA1\u730E\u8058",
    cost: 2e5,
    // 4 倍于普通猎头
    deliveryDays: 14,
    baseAttribute: 85,
    levelRange: [7, 10],
    // 仅高管候选
    candidateCount: 2
  }
};
function levelMultiplier(level) {
  if (level <= 2) return 1;
  if (level <= 4) return 1.3;
  if (level <= 6) return 1.7;
  if (level <= 8) return 2.2;
  return 3;
}
var ROLE_PRIMARY_ATTR = {
  ["researcher" /* RESEARCHER */]: "intelligence",
  ["data_engineer" /* DATA_ENGINEER */]: "intelligence",
  ["system_engineer" /* SYSTEM_ENGINEER */]: "intelligence",
  ["product_manager" /* PRODUCT_MANAGER */]: "leadership",
  ["legal_pr" /* LEGAL_PR */]: "charisma",
  ["manager" /* MANAGER */]: "leadership"
};
var BONUS_COOLDOWN_DAYS = 30;
var BONUS_SALARY_RATIO = 0.1;
var BONUS_LOYALTY_GAIN = 15;
var EQUITY_COOLDOWN_DAYS = 90;
var EQUITY_LOYALTY_GAIN = 30;
var TEAM_BUILDING_COST_PER_HEAD = 1e4;
var TEAM_BUILDING_COOLDOWN_DAYS = 30;
var TEAM_BUILDING_LOYALTY_GAIN = 5;
var TEAM_BUILDING_FATIGUE_REDUCE = 20;
var PROMOTE_EXP_RATIO = 0.8;
var PROMOTE_MIN_GRADE = "A";
var PROMOTE_COOLDOWN_DAYS = 90;
var PROMOTE_SKILL_POINT_GAIN = 2;
var NORMAL_HIRE_TIER_THRESHOLD = 50;
var NORMAL_HIRE_TIER_INCREMENT = 0.05;
function calcNormalHireCost(currentCount) {
  const extra = Math.max(0, currentCount - NORMAL_HIRE_TIER_THRESHOLD);
  return Math.round(NORMAL_HIRE_COST * (1 + extra * NORMAL_HIRE_TIER_INCREMENT));
}
var PERFORMANCE_EVAL_PERIOD = 30;
var PERFORMANCE_GRADE_THRESHOLDS = {
  S: 85,
  A: 70,
  B: 50
  // C: < 50
};
var PERFORMANCE_S_SKILL_POINT = 1;
var PERFORMANCE_C_LOYALTY_PENALTY = 5;

// ../../src/core/entities/StaffTrainingProject.ts
var STAFF_TRAINING_CONFIG = {
  skill: {
    type: "skill",
    name: "\u6280\u80FD\u57F9\u8BAD",
    durationDays: 7,
    cost: 5e3,
    expGain: 50,
    attributeGain: 5,
    skillPointGain: 0,
    allAttributes: false,
    minLevel: 1
  },
  advanced: {
    type: "advanced",
    name: "\u9AD8\u7EA7\u7814\u4FEE",
    durationDays: 30,
    cost: 3e4,
    expGain: 300,
    attributeGain: 10,
    skillPointGain: 1,
    allAttributes: false,
    minLevel: 1
  },
  overseas: {
    type: "overseas",
    name: "\u6D77\u5916\u4EA4\u6D41",
    durationDays: 60,
    cost: 1e5,
    expGain: 800,
    attributeGain: 5,
    skillPointGain: 2,
    allAttributes: true,
    minLevel: 5
  }
};

// ../../src/core/utils/employeeUtils.ts
function baseEfficiency(level) {
  return 0.5 + (level - 1) * 0.17;
}
function attributeFactor(emp) {
  const primaryAttr = ROLE_PRIMARY_ATTR[emp.role];
  const value = emp.attributes[primaryAttr];
  return 0.7 + value / 100 * 0.6;
}
function fatigueFactor(fatigue) {
  return 1 - fatigue / 100 * 0.5;
}
function loyaltyFactor(loyalty) {
  if (loyalty < 50) return 0.8 + loyalty / 50 * 0.2;
  return 1 + Math.max(0, (loyalty - 80) / 20) * 0.05;
}
function departmentBonus(dept, employees) {
  if (!dept || !dept.headId) return 1;
  const head = employees.find((e) => e.id === dept.headId);
  if (!head) return 1;
  return 1 + head.attributes.leadership / 100 * 0.3;
}
function companyCoordination(departments, employees) {
  const heads = departments.map((d) => employees.find((e) => e.id === d.headId)).filter((e) => e !== void 0);
  if (heads.length === 0) return 1;
  const avgLeadership = heads.reduce((s, e) => s + e.attributes.leadership, 0) / heads.length;
  return 1 + avgLeadership / 100 * 0.1;
}
function calcEmployeeEfficiency(emp, departments, employees) {
  const dept = departments.find((d) => d.id === emp.departmentId);
  return baseEfficiency(emp.level) * attributeFactor(emp) * fatigueFactor(emp.fatigue) * loyaltyFactor(emp.loyalty) * departmentBonus(dept, employees) * companyCoordination(departments, employees);
}
function marketSalary(role, region) {
  const base = ROLE_CONFIG[role].baseSalary;
  if (!region) return base;
  const multiplier = 0.5 + region.talentIndex / 100 * 0.5;
  return Math.round(base * multiplier);
}
function salaryCompetitiveness(emp, region) {
  const market = marketSalary(emp.role, region);
  if (market === 0) return 1;
  return emp.salary / market;
}
function salaryLoyaltyDelta(competitiveness) {
  if (competitiveness < 0.7) return -0.5;
  if (competitiveness < 1) return -0.1;
  if (competitiveness < 1.3) return 0;
  return 0.2;
}
function calcSalaryForLevel(role, level, region) {
  const base = ROLE_CONFIG[role].baseSalary;
  const multiplier = levelMultiplier(level);
  const regionMult = region ? 0.5 + region.talentIndex / 100 * 0.5 : 1;
  return Math.round(base * multiplier * regionMult);
}
function generateCandidateAttributes(baseAttr, roleWeights, level = 1) {
  const keys = ["intelligence", "creativity", "leadership", "stamina", "charisma"];
  const tierMin = level <= 2 ? 200 : level <= 4 ? 280 : level <= 6 ? 350 : 410;
  const tierMax = level <= 2 ? 250 : level <= 4 ? 320 : level <= 6 ? 400 : 460;
  const totalPool = tierMin + Math.random() * (tierMax - tierMin) + (baseAttr - 65) * 0.5;
  const rawWeights = keys.map((k) => (roleWeights[k] ?? 0.1) * 2 + 0.3);
  const samples = rawWeights.map((w) => {
    const u1 = Math.random() || 1e-3;
    const u2 = Math.random() || 1e-3;
    const gamma = -2 * Math.log(u1) * Math.cos(2 * Math.PI * u2) + 2;
    return Math.max(0.01, w * gamma);
  });
  const sumSamples = samples.reduce((s, v) => s + v, 0);
  const proportions = samples.map((v) => v / sumSamples);
  const result = {};
  keys.forEach((k, i) => {
    const noise = (Math.random() - 0.5) * 8;
    const raw = totalPool * proportions[i] + noise;
    result[k] = clamp(Math.round(raw), 25, 99);
  });
  return result;
}
function resignProbability(loyalty, fatigue) {
  let p = Math.max(0, (30 - loyalty) / 100);
  if (fatigue > 90) p += 0.05;
  return p;
}

// ../../src/core/utils/techEffectScale.ts
function scaleTechEffect(effect, maturity) {
  if (maturity >= 100) return effect;
  const scale = Math.max(0, maturity) / 100;
  if (scale <= 0) {
    switch (effect.type) {
      case "unlock_parallel_strategy":
      case "parallel_reliability":
      case "unlock_data_purge":
      case "unlock_data_dedup":
      case "unlock_data_curate":
      case "unlock_sft":
      case "unlock_rlhf":
      case "unlock_dpo":
      case "unlock_cot":
      case "unlock_cluster_network":
      case "upgrade_storage":
      case "upgrade_network_topology":
      case "enable_synthetic_data":
        return effect;
      default:
        return effect;
    }
  }
  switch (effect.type) {
    // 线性缩放数值型
    case "modify_base_score_E":
    case "modify_base_score_A":
    case "modify_base_score_B":
    case "modify_alpha":
    case "modify_beta":
    case "reduce_compute_cost":
    case "reduce_memory":
    case "improve_research_speed":
    case "improve_experiment_confidence":
    case "reduce_training_crash_risk":
    case "improve_data_quality":
    case "reduce_legal_risk":
    case "improve_alignment":
    case "improve_utilization":
    case "improve_parallel_efficiency":
    case "reduce_cooling_pue":
      return { ...effect, value: effect.value * scale };
    case "capability_bonus":
      return { ...effect, bonus: effect.bonus * scale };
    case "enable_distillation":
      return { ...effect, efficiencyBonus: effect.efficiencyBonus * scale };
    case "enable_synthetic_data":
      return { ...effect, qualityBonus: effect.qualityBonus * scale };
    case "extend_context":
      return { ...effect, multiplier: 1 + (effect.multiplier - 1) * scale };
    // 解锁型不缩放（maturity≥1 即生效）
    case "unlock_parallel_strategy":
    case "parallel_reliability":
    case "unlock_data_purge":
    case "unlock_data_dedup":
    case "unlock_data_curate":
    case "unlock_sft":
    case "unlock_rlhf":
    case "unlock_dpo":
    case "unlock_cot":
    case "unlock_cluster_network":
    case "upgrade_storage":
    case "upgrade_network_topology":
      return effect;
    default:
      return effect;
  }
}
function aggregateMultiplicative(effects, type, maxCap = 1) {
  let product = 1;
  for (const e of effects) {
    if (e.type === type && "value" in e) {
      const v = Math.max(0, Math.min(1, e.value));
      product *= 1 - v;
    }
  }
  const combined = 1 - product;
  return Math.max(0, Math.min(maxCap, combined));
}
function aggregateCapabilityBonuses(effects, maxPerCapability = 0.5) {
  const result = {};
  for (const e of effects) {
    if (e.type === "capability_bonus") {
      const cap = e.capability;
      result[cap] = (result[cap] ?? 0) + e.bonus;
    }
  }
  for (const cap of Object.keys(result)) {
    result[cap] = Math.max(0, Math.min(maxPerCapability, result[cap]));
  }
  return result;
}
function aggregateAdditive(effects, type, options = {}) {
  let sum = 0;
  for (const e of effects) {
    if (e.type === type && "value" in e) {
      sum += e.value;
    }
  }
  if (options.maxCap !== void 0) sum = Math.min(sum, options.maxCap);
  if (options.minCap !== void 0) sum = Math.max(sum, options.minCap);
  return sum;
}
var TECH_EFFECT_CAPS = {
  reduce_compute_cost: 0.6,
  // 训练算力减少最多 60%（仍需付 40%）
  reduce_memory: 0.7,
  // 显存减少最多 70%
  reduce_training_crash_risk: 0.8,
  // 崩溃风险降低最多 80%
  reduce_legal_risk: 0.7,
  // 法律风险降低最多 70%
  reduce_cooling_pue: 0.5,
  // PUE 降低最多 50%
  improve_utilization: 0.3,
  // 利用率提升最多 +30%
  improve_research_speed: 1,
  // 研发速度最多 +100%
  improve_experiment_confidence: 0.5,
  // 实验置信度最多 +50%
  improve_parallel_efficiency: 0.5,
  // 并行效率最多 +50%
  improve_data_quality: 0.5,
  // 数据质量最多 +50%
  improve_alignment: 0.8,
  // 对齐最多 +80%
  extend_context: 32,
  // 上下文最多 32×
  capability_bonus: 0.5,
  // 每能力加成最多 +50%
  modify_base_score_A: 500,
  // A 参数调整范围 ±500
  modify_base_score_B: 500,
  // B 参数调整范围 ±500
  modify_base_score_E: 2,
  // E 参数调整范围 ±2.0
  modify_alpha: 0.5,
  // alpha 调整范围 ±0.5
  modify_beta: 0.5
  // beta 调整范围 ±0.5
};

// ../../src/core/config/management.ts
var MANAGEMENT_MODES = {
  flat: {
    id: "flat",
    displayName: "\u6241\u5E73",
    description: "CEO \u76F4\u63A5\u7BA1\u7406\u6240\u6709\u4EBA\uFF0C\u51B3\u7B56\u5FEB\uFF0C\u9002\u5408\u5C0F\u56E2\u961F\uFF08< 30 \u4EBA\uFF09",
    scaleRange: [0, 30],
    requiredManagers: 1,
    baseEfficiency: 1,
    switchCostBase: 1e5,
    switchCostPerManager: 5e3
  },
  matrix: {
    id: "matrix",
    displayName: "\u77E9\u9635",
    description: "\u804C\u80FD + \u9879\u76EE\u53CC\u7EBF\u7BA1\u7406\uFF0C\u9002\u5408\u4E2D\u7B49\u89C4\u6A21\uFF0830-100 \u4EBA\uFF09",
    scaleRange: [30, 100],
    requiredManagers: 3,
    baseEfficiency: 1.05,
    switchCostBase: 3e5,
    switchCostPerManager: 1e4
  },
  divisional: {
    id: "divisional",
    displayName: "\u4E8B\u4E1A\u90E8",
    description: "\u6309\u4E1A\u52A1\u7EBF\u5212\u5206\uFF0C\u81EA\u6CBB\u6027\u5F3A\uFF0C\u9002\u5408\u5927\u89C4\u6A21\uFF08100-300 \u4EBA\uFF09",
    scaleRange: [100, 300],
    requiredManagers: 6,
    baseEfficiency: 1.1,
    switchCostBase: 6e5,
    switchCostPerManager: 15e3
  },
  holding: {
    id: "holding",
    displayName: "\u63A7\u80A1\u96C6\u56E2",
    description: "\u591A\u5730\u533A/\u591A\u4E1A\u52A1\uFF0C\u6700\u5927\u89C4\u6A21\u652F\u6301\uFF08> 300 \u4EBA\uFF09",
    scaleRange: [300, Infinity],
    requiredManagers: 10,
    baseEfficiency: 1.15,
    switchCostBase: 1e6,
    switchCostPerManager: 2e4
  }
};
var MODE_SWITCH_COOLDOWN_DAYS = 60;
function getCompanyScale(normalHeadcountTotal) {
  if (normalHeadcountTotal < 30) return "small";
  if (normalHeadcountTotal < 100) return "medium";
  if (normalHeadcountTotal < 300) return "large";
  return "huge";
}
function getModeMatchFactor(currentMode, scale) {
  const modeOrder = ["flat", "matrix", "divisional", "holding"];
  const scaleOrder = ["small", "medium", "large", "huge"];
  const modeIdx = modeOrder.indexOf(currentMode);
  const scaleIdx = scaleOrder.indexOf(scale);
  const diff = Math.abs(modeIdx - scaleIdx);
  return [1, 0.85, 0.7, 0.55][Math.min(diff, 3)];
}
var EXECUTIVE_CONFIGS = {
  ceo: {
    role: "ceo",
    displayName: "CEO",
    minLevel: 8,
    minLeadership: 75,
    minCharisma: 70,
    efficiencyBonus: 0.03,
    moraleFloor: 5
  },
  coo: {
    role: "coo",
    displayName: "COO",
    minLevel: 7,
    minLeadership: 70,
    minCharisma: 60,
    efficiencyBonus: 0.02,
    infraFailureReduction: 0.05
  },
  cfo: {
    role: "cfo",
    displayName: "CFO",
    minLevel: 7,
    minLeadership: 65,
    minCharisma: 65,
    efficiencyBonus: 0.015,
    salaryDiscount: 0.03
  },
  cto: {
    role: "cto",
    displayName: "CTO",
    minLevel: 8,
    minLeadership: 70,
    minCharisma: 0,
    efficiencyBonus: 0.025,
    researchSpeedBonus: 0.05
  }
};
var EXECUTIVE_ROLES = ["ceo", "coo", "cfo", "cto"];
function getExecutiveBonus(data) {
  const exec = data.executives;
  const empMap = new Map(data.employees.map((e) => [e.id, e]));
  let efficiencyBonus = 0;
  let moraleFloor = 0;
  let infra = 0;
  let salary = 0;
  let research = 0;
  let appointedCount = 0;
  for (const role of EXECUTIVE_ROLES) {
    const slotKey = `${role}Id`;
    const id = exec[slotKey];
    if (id && empMap.has(id)) {
      const cfg = EXECUTIVE_CONFIGS[role];
      efficiencyBonus += cfg.efficiencyBonus;
      if (cfg.moraleFloor) moraleFloor = Math.max(moraleFloor, cfg.moraleFloor);
      if (cfg.infraFailureReduction) infra += cfg.infraFailureReduction;
      if (cfg.salaryDiscount) salary += cfg.salaryDiscount;
      if (cfg.researchSpeedBonus) research += cfg.researchSpeedBonus;
      appointedCount++;
    }
  }
  return {
    efficiencyBonus,
    moraleFloor,
    infraFailureReduction: infra,
    salaryDiscount: salary,
    researchSpeedBonus: research,
    appointedCount
  };
}
function calcModeSwitchCost(targetMode, currentManagers) {
  const cfg = MANAGEMENT_MODES[targetMode];
  return cfg.switchCostBase + cfg.switchCostPerManager * currentManagers;
}
function getManagerStaffingRatio(data) {
  const modeCfg = MANAGEMENT_MODES[data.managementMode];
  const requiredManagers = modeCfg.requiredManagers;
  if (requiredManagers === 0) return 1;
  const coreManagers = data.employees.filter(
    (e) => e.role === "manager" /* MANAGER */ && e.status !== "training"
  ).length;
  return Math.min(coreManagers / requiredManagers, 1);
}

// ../../src/core/utils/crossSystemUtils.ts
var employeeMapCache = /* @__PURE__ */ new WeakMap();
function getEmployeeMap(data) {
  const list = data.employees;
  let map = employeeMapCache.get(list);
  if (map !== void 0) return map;
  map = /* @__PURE__ */ new Map();
  for (const e of data.employees) {
    map.set(e.id, e);
  }
  employeeMapCache.set(list, map);
  return map;
}
function getActiveStaffByRole(data, role) {
  return data.employees.filter(
    (e) => e.role === role && e.status !== "training"
  );
}
function getDepartment(data, type) {
  const dept = data.departments.find((d) => d.type === type);
  if (!dept) return { dept: void 0, head: void 0, members: [] };
  const head = dept.headId ? data.employees.find((e) => e.id === dept.headId) : void 0;
  const members = dept.memberIds.map((id) => data.employees.find((e) => e.id === id)).filter((e) => e !== void 0);
  return { dept, head, members };
}
function getStaffTrainingSpeedMultiplier(data, projectId) {
  const researchers = getActiveStaffByRole(data, "researcher" /* RESEARCHER */);
  if (researchers.length === 0) return 1;
  let totalBonus = 0;
  for (const r of researchers) {
    const eff = calcEmployeeEfficiency(r, data.departments, data.employees);
    const hasOptimizer = r.skills.some((s) => s.unlocked && s.effect.type === "reduce_training_compute");
    const directWeight = r.assignedProjectId === projectId && projectId !== void 0 ? 0.015 : 3e-3;
    const weight = directWeight * (hasOptimizer ? 1.5 : 1);
    totalBonus += eff * weight;
  }
  const diminishing = Math.log(1 + researchers.length) / Math.log(11);
  const mgmtEff = getManagementEfficiency(data);
  return (1 + totalBonus * diminishing) * mgmtEff;
}
function getStaffTrainingStabilityBonus(data) {
  const researchers = getActiveStaffByRole(data, "researcher" /* RESEARCHER */).filter((r) => r.level >= 5);
  if (researchers.length === 0) return 0;
  const avgIntelligence = researchers.reduce((s, r) => s + r.attributes.intelligence, 0) / researchers.length;
  const mgmtEff = getManagementEfficiency(data);
  return Math.min(0.5, avgIntelligence / 100 * 3e-3 * researchers.length) * mgmtEff;
}
function getStaffResearchSpeedMultiplier(data) {
  const researchers = getActiveStaffByRole(data, "researcher" /* RESEARCHER */);
  if (researchers.length === 0) return 1;
  let totalBonus = 0;
  for (const r of researchers) {
    const eff = calcEmployeeEfficiency(r, data.departments, data.employees);
    totalBonus += eff * (r.attributes.creativity / 100) * 0.03;
  }
  const mgmtEff = getManagementEfficiency(data);
  return (1 + Math.min(totalBonus, 1)) * mgmtEff;
}
function getStaffInfraFailureReduction(data) {
  const engineers = getActiveStaffByRole(data, "system_engineer" /* SYSTEM_ENGINEER */);
  if (engineers.length === 0) return 1;
  const { dept } = getDepartment(data, "infrastructure");
  const deptBonus = dept ? departmentBonus(dept, data.employees) : 1;
  const coordination = companyCoordination(data.departments, data.employees);
  let totalReduction = 0;
  for (const eng of engineers) {
    const eff = calcEmployeeEfficiency(eng, data.departments, data.employees);
    totalReduction += eff * 0.02;
  }
  const mgmtEff = getManagementEfficiency(data);
  return Math.max(0.3, 1 - totalReduction * deptBonus * coordination) * mgmtEff;
}
function getStaffRevenueMultiplier(data) {
  const pms = getActiveStaffByRole(data, "product_manager" /* PRODUCT_MANAGER */);
  if (pms.length === 0) return 1;
  const { dept } = getDepartment(data, "product");
  const deptBonus = dept ? departmentBonus(dept, data.employees) : 1;
  let totalBonus = 0;
  for (const pm of pms) {
    const eff = calcEmployeeEfficiency(pm, data.departments, data.employees);
    totalBonus += eff * 0.03;
  }
  const mgmtEff = getManagementEfficiency(data);
  return 1 + totalBonus * deptBonus * mgmtEff;
}
function getStaffLegalRiskReductionPerDay(data) {
  const legalStaff = getActiveStaffByRole(data, "legal_pr" /* LEGAL_PR */);
  if (legalStaff.length === 0) return 0;
  const { dept } = getDepartment(data, "legal_pr");
  const deptBonus = dept ? departmentBonus(dept, data.employees) : 1;
  let total = 0;
  for (const l of legalStaff) {
    const eff = calcEmployeeEfficiency(l, data.departments, data.employees);
    total += eff * 0.3;
  }
  const mgmtEff = getManagementEfficiency(data);
  return total * deptBonus * mgmtEff;
}
function calcMoraleImpactFromOperations(dailyRevenue, previousRevenue) {
  if (previousRevenue <= 0) return 0;
  const ratio = dailyRevenue / previousRevenue;
  if (ratio > 1.2) return 0.5;
  if (ratio > 1.05) return 0.2;
  if (ratio < 0.8) return -0.5;
  if (ratio < 0.95) return -0.2;
  return 0;
}
function accumulateResearcherContribution(data, researcherIds, contributionPerDay) {
  const empMap = getEmployeeMap(data);
  for (const rid of researcherIds) {
    const emp = empMap.get(rid);
    if (emp) {
      emp.monthlyContribution = (emp.monthlyContribution ?? 0) + contributionPerDay;
    }
  }
}
function getDataEngineerBonus(data, _projectId, assignedIds) {
  const allDataEngineers = getActiveStaffByRole(data, "data_engineer" /* DATA_ENGINEER */);
  if (allDataEngineers.length === 0) return { speedMultiplier: 1, qualityBonus: 0 };
  let directBonus = 0;
  let passiveBonus = 0;
  let qualityBonus = 0;
  const assignedSet = new Set(assignedIds);
  for (const eng of allDataEngineers) {
    const eff = calcEmployeeEfficiency(eng, data.departments, data.employees);
    if (assignedSet.has(eng.id)) {
      directBonus += eff * 0.05;
    } else {
      passiveBonus += eff * 0.01;
    }
    qualityBonus += eng.attributes.creativity / 100 * 5e-3;
  }
  const mgmtEff = getManagementEfficiency(data);
  return {
    speedMultiplier: (1 + directBonus + passiveBonus) * mgmtEff,
    qualityBonus: Math.min(0.15, qualityBonus)
  };
}
function getCompanySkillBonus(data, effectType) {
  let total = 0;
  for (const emp of data.employees) {
    if (emp.status === "training") continue;
    for (const skill of emp.skills) {
      if (skill.unlocked && skill.effect.type === effectType) {
        total += skill.effect.value;
      }
    }
  }
  return total;
}
function getCompanyPowerReduction(data) {
  return Math.min(0.5, getCompanySkillBonus(data, "reduce_power_consumption"));
}
function getCompanyTrainingComputeReduction(data) {
  return Math.min(0.5, getCompanySkillBonus(data, "reduce_training_compute"));
}
function getCompanyCollectionSpeed(data) {
  return getCompanySkillBonus(data, "data_speed");
}
function getTotalNormalHeadcount(data) {
  const staffIds = [
    "staff_researcher",
    "staff_data_engineer",
    "staff_system_engineer",
    "staff_product_manager",
    "staff_legal_pr",
    "staff_manager"
  ];
  let total = 0;
  for (const id of staffIds) {
    total += data.resources[id] ?? 0;
  }
  return total;
}
function getCompanyFatigueReduction(data) {
  const normalManagers = data.resources["staff_manager"] ?? 0;
  return Math.min(0.5, normalManagers * 0.05);
}
function getCompanySalaryDiscount(data) {
  return getExecutiveBonus(data).salaryDiscount;
}
function getCompanyMoraleFloor(data) {
  return getExecutiveBonus(data).moraleFloor;
}
function getManagementEfficiency(data) {
  const totalNormalStaff = getTotalNormalHeadcount(data);
  if (totalNormalStaff < 5) return 1;
  const mode = data.managementMode;
  const modeCfg = MANAGEMENT_MODES[mode];
  const scale = getCompanyScale(totalNormalStaff);
  const modeMatch = getModeMatchFactor(mode, scale);
  const staffingRatio = getManagerStaffingRatio(data);
  const execBonus = getExecutiveBonus(data).efficiencyBonus;
  const skillBonus = getCompanySkillBonus(data, "management_efficiency");
  const raw = modeCfg.baseEfficiency * staffingRatio * modeMatch * (1 + execBonus) * (1 + skillBonus);
  return Math.max(0.5, Math.min(1.3, raw));
}
var activeTechEffectsCache = /* @__PURE__ */ new WeakMap();
function getActiveTechEffects(data) {
  const matRef = data.techMaturity;
  const cached = activeTechEffectsCache.get(matRef);
  if (cached !== void 0) return cached;
  const effects = [];
  for (const [techId, maturity] of Object.entries(data.techMaturity)) {
    if (maturity < 1) continue;
    const node = TECH_MAP[techId] ?? IDEA_TECH_MAP[techId];
    if (!node) continue;
    effects.push(scaleTechEffect(node.effect, maturity));
  }
  activeTechEffectsCache.set(matRef, effects);
  return effects;
}

// ../../src/core/systems/StaffSystem.ts
var StaffSystem = class _StaffSystem {
  name = "StaffSystem";
  static DAILY_LOYALTY_DECAY = 0.1;
  static DAILY_EXPERIENCE_WORK = 2;
  static DAILY_EXPERIENCE_IDLE = 0.5;
  static IDLE_FATIGUE_RECOVERY = 5;
  static WORK_FATIGUE_BASE = 1.5;
  update(state, events, deltaDays) {
    const today = state.read().date;
    const resignList = [];
    const levelUpList = [];
    const trainingCompletedList = [];
    state.update((draft) => {
      const survivors = [];
      const moraleFloor = getCompanyMoraleFloor(draft);
      if (draft.riskState.employeeMorale < 100) {
        draft.riskState.employeeMorale = Math.min(
          100,
          Math.max(moraleFloor, draft.riskState.employeeMorale + 0.1 * deltaDays)
        );
      }
      const hqRegionId = draft.headquartersRegionId;
      const hqRegion = hqRegionId ? REGIONS.find((r) => r.id === hqRegionId) ?? null : null;
      for (const emp of draft.employees) {
        if (emp.status === "training" && emp.trainingId) {
          const training = draft.staffTrainings.find((t) => t.id === emp.trainingId);
          if (training && training.status === "in_progress") {
            training.elapsedDays += deltaDays;
            emp.fatigue = clamp(emp.fatigue - 3 * deltaDays, 0, 100);
            if (training.elapsedDays >= training.totalDays) {
              training.status = "completed";
              this.applyTrainingCompletion(emp, training);
              emp.status = "idle";
              emp.trainingId = void 0;
              trainingCompletedList.push({ employeeId: emp.id, trainingId: training.id });
            }
          }
        } else {
          if (emp.status === "assigned") {
            const fatigueReduction = getCompanyFatigueReduction(draft);
            const baseGain = _StaffSystem.WORK_FATIGUE_BASE * (100 / Math.max(emp.attributes.stamina, 1)) * deltaDays;
            const fatigueGain = Math.max(0, baseGain - fatigueReduction * deltaDays);
            emp.fatigue = clamp(emp.fatigue + fatigueGain, 0, 100);
            emp.monthlyWorkDays = (emp.monthlyWorkDays ?? 0) + deltaDays;
          } else {
            emp.fatigue = clamp(emp.fatigue - _StaffSystem.IDLE_FATIGUE_RECOVERY * deltaDays, 0, 100);
          }
          const expGain = (emp.status === "assigned" ? _StaffSystem.DAILY_EXPERIENCE_WORK : _StaffSystem.DAILY_EXPERIENCE_IDLE) * deltaDays;
          emp.experience += expGain;
          while (emp.experience >= experienceForLevel(emp.level)) {
            emp.experience -= experienceForLevel(emp.level);
            emp.level += 1;
            emp.skillPoints += LEVEL_UP_SKILL_POINTS;
            const attrKeys = ["intelligence", "creativity", "leadership", "stamina", "charisma"];
            const shuffled = [...attrKeys].sort(() => Math.random() - 0.5);
            emp.attributes[shuffled[0]] += LEVEL_UP_ATTRIBUTE_GAIN;
            emp.attributes[shuffled[1]] += LEVEL_UP_ATTRIBUTE_GAIN;
            levelUpList.push({ employeeId: emp.id, newLevel: emp.level });
          }
        }
        let loyaltyDelta = -_StaffSystem.DAILY_LOYALTY_DECAY * deltaDays;
        if (emp.fatigue > 70) {
          loyaltyDelta -= (emp.fatigue - 70) * 0.02 * deltaDays;
        }
        loyaltyDelta += emp.attributes.charisma * 0.01 * deltaDays;
        const competitiveness = salaryCompetitiveness(emp, hqRegion);
        loyaltyDelta += salaryLoyaltyDelta(competitiveness) * deltaDays;
        const morale = draft.riskState.employeeMorale ?? 50;
        const moraleEffect = (morale - 50) / 50 * 0.2;
        loyaltyDelta += moraleEffect * deltaDays;
        emp.loyalty = clamp(emp.loyalty + loyaltyDelta, 0, 100);
        const equityLocked = emp.hasEquity && emp.equityGrantedDay !== void 0 && today - emp.equityGrantedDay < 730;
        if (!equityLocked) {
          const p = resignProbability(emp.loyalty, emp.fatigue) * deltaDays;
          if (p > 0 && Math.random() < p) {
            resignList.push({ id: emp.id, name: emp.name, role: emp.role });
            continue;
          }
        }
        survivors.push(emp);
      }
      draft.employees = survivors;
      const resignedIds = new Set(resignList.map((r) => r.id));
      if (resignedIds.size > 0) {
        const exec = draft.executives;
        if (exec.ceoId && resignedIds.has(exec.ceoId)) exec.ceoId = null;
        if (exec.cooId && resignedIds.has(exec.cooId)) exec.cooId = null;
        if (exec.cfoId && resignedIds.has(exec.cfoId)) exec.cfoId = null;
        if (exec.ctoId && resignedIds.has(exec.ctoId)) exec.ctoId = null;
      }
    });
    for (const emp of resignList) {
      events.emit("EMPLOYEE_RESIGNED", emp);
    }
    for (const { employeeId, newLevel } of levelUpList) {
      events.emit("EMPLOYEE_LEVEL_UP", employeeId, newLevel);
    }
    for (const { employeeId, trainingId } of trainingCompletedList) {
      events.emit("STAFF_TRAINING_COMPLETED", { employeeId, trainingId });
    }
    this.processDailyPayroll(state, events, deltaDays, today);
    if (today > 0 && today - state.read().lastPerformanceEvalDay >= PERFORMANCE_EVAL_PERIOD) {
      this.evaluatePerformance(state, events);
    }
    state.update((draft) => {
      if (draft.pendingCandidates.length > 0) {
        const pendingOnly = draft.pendingCandidates.filter((c) => c.status === "pending");
        if (pendingOnly.length < draft.pendingCandidates.length) {
          draft.pendingCandidates = pendingOnly;
        }
      }
    });
  }
  /** 应用培训完成效果 */
  applyTrainingCompletion(emp, training) {
    const cfg = STAFF_TRAINING_CONFIG[training.type];
    emp.experience += cfg.expGain;
    emp.skillPoints += cfg.skillPointGain;
    if (cfg.allAttributes) {
      emp.attributes.intelligence += cfg.attributeGain;
      emp.attributes.creativity += cfg.attributeGain;
      emp.attributes.leadership += cfg.attributeGain;
      emp.attributes.stamina += cfg.attributeGain;
      emp.attributes.charisma += cfg.attributeGain;
    } else if (training.targetAttribute) {
      emp.attributes[training.targetAttribute] += cfg.attributeGain;
    }
  }
  /** 每日扣薪（设计 #4：按日累计精确计算，不再按周期一次性扣）
   *  公司管理扩展：CFO 任命后全员薪资支出 -3%（乘算） */
  processDailyPayroll(state, events, deltaDays, today) {
    const current2 = state.read();
    const salaryDiscount = getCompanySalaryDiscount(current2);
    const dailyTotal = current2.employees.reduce((sum, e) => sum + e.salary / 365, 0);
    const totalSalary = dailyTotal * deltaDays * (1 - salaryDiscount);
    if (totalSalary > 0) {
      state.update((draft) => {
        draft.resources["funds"] = Math.max(0, (draft.resources["funds"] ?? 0) - totalSalary);
      });
      if (today > 0 && today % PAY_PERIOD_DAYS === 0) {
        events.emit("SALARY_PAID", dailyTotal * PAY_PERIOD_DAYS, current2.employees.length);
      }
    }
  }
  /** 绩效评估（每月一次） */
  evaluatePerformance(state, events) {
    const today = state.read().date;
    const evaluations = [];
    state.update((draft) => {
      for (const emp of draft.employees) {
        const workDays = emp.monthlyWorkDays ?? 0;
        const contribution = emp.monthlyContribution ?? 0;
        const skillCount = emp.skills.filter((s) => s.unlocked).length;
        const attendance = clamp(workDays / 30, 0, 1);
        const score = attendance * 50 + clamp(contribution, 0, 100) * 0.3 + Math.min(skillCount, 5) * 10 + (emp.loyalty > 70 ? 10 : 0);
        let grade = "C";
        if (score >= PERFORMANCE_GRADE_THRESHOLDS.S) grade = "S";
        else if (score >= PERFORMANCE_GRADE_THRESHOLDS.A) grade = "A";
        else if (score >= PERFORMANCE_GRADE_THRESHOLDS.B) grade = "B";
        emp.lastPerformance = {
          evalDay: today,
          attendance,
          projectContribution: contribution,
          score: Math.round(score),
          grade
        };
        if (grade === "S") {
          emp.skillPoints += PERFORMANCE_S_SKILL_POINT;
        } else if (grade === "C") {
          emp.loyalty = clamp(emp.loyalty - PERFORMANCE_C_LOYALTY_PENALTY, 0, 100);
        }
        emp.monthlyWorkDays = 0;
        emp.monthlyContribution = 0;
        evaluations.push({ employeeId: emp.id, grade, score: Math.round(score) });
      }
      draft.lastPerformanceEvalDay = today;
    });
    events.emit("PERFORMANCE_EVALUATED", evaluations);
  }
  /**
   * 挖角处理：外部高薪挖角某员工。
   * @returns true 表示员工被挖走（已从 state 移除）
   */
  attemptPoaching(state, events, empId, offerSalary) {
    const current2 = state.read();
    const emp = current2.employees.find((e) => e.id === empId);
    if (!emp) return false;
    const equityLocked = emp.hasEquity && emp.equityGrantedDay !== void 0 && current2.date - emp.equityGrantedDay < 730;
    if (equityLocked) {
      events.emit("POACH_FAILED", empId, offerSalary);
      return false;
    }
    const salaryRatio = offerSalary / Math.max(emp.salary, 1);
    const loyaltyFactor2 = emp.loyalty / 100;
    const successChance = clamp((salaryRatio - 1) * 0.5 - loyaltyFactor2 * 0.5, 0, 0.95);
    if (Math.random() < successChance) {
      state.update((draft) => {
        draft.employees = draft.employees.filter((e) => e.id !== empId);
        const exec = draft.executives;
        if (exec.ceoId === empId) exec.ceoId = null;
        if (exec.cooId === empId) exec.cooId = null;
        if (exec.cfoId === empId) exec.cfoId = null;
        if (exec.ctoId === empId) exec.ctoId = null;
      });
      events.emit("EMPLOYEE_POACHED", empId, offerSalary);
      return true;
    }
    events.emit("POACH_FAILED", empId, offerSalary);
    return false;
  }
};

// ../../src/core/config/infrastructure.ts
var NODE_TEMPLATES = [
  // ===== Tier 1：入门 =====
  {
    id: "node_4_pcie4",
    name: "4-GPU PCIe4 \u670D\u52A1\u5668",
    slotCount: 4,
    interconnect: "PCIe4",
    interconnectBandwidth: 64,
    powerSupplyKW: 3,
    maxPowerDrawKW: 2.4,
    nvswitchGeneration: 0,
    reliability: 90,
    nodeType: "standard",
    cost: 18e3,
    maintenanceCost: 25
  },
  {
    id: "node_8_pcie4",
    name: "8-GPU PCIe4 \u670D\u52A1\u5668",
    slotCount: 8,
    interconnect: "PCIe4",
    interconnectBandwidth: 64,
    powerSupplyKW: 6,
    maxPowerDrawKW: 4.8,
    nvswitchGeneration: 0,
    reliability: 88,
    nodeType: "standard",
    cost: 35e3,
    maintenanceCost: 40
  },
  // ===== Tier 2：中端 =====
  {
    id: "node_4_pcie5",
    name: "4-GPU PCIe5 \u670D\u52A1\u5668",
    slotCount: 4,
    interconnect: "PCIe5",
    interconnectBandwidth: 128,
    powerSupplyKW: 4,
    maxPowerDrawKW: 3.2,
    nvswitchGeneration: 0,
    reliability: 88,
    nodeType: "standard",
    cost: 25e3,
    maintenanceCost: 30
  },
  {
    id: "node_8_pcie5",
    name: "8-GPU PCIe5 \u670D\u52A1\u5668",
    slotCount: 8,
    interconnect: "PCIe5",
    interconnectBandwidth: 128,
    powerSupplyKW: 8,
    maxPowerDrawKW: 6.4,
    nvswitchGeneration: 0,
    reliability: 88,
    nodeType: "standard",
    cost: 4e4,
    maintenanceCost: 40
  },
  // ===== Tier 3：高端 =====
  {
    id: "node_8_nvlink3",
    name: "8-GPU NVLink3 \u670D\u52A1\u5668",
    slotCount: 8,
    interconnect: "NVLink3",
    interconnectBandwidth: 600,
    powerSupplyKW: 6.5,
    maxPowerDrawKW: 5,
    nvswitchGeneration: 0,
    reliability: 92,
    nodeType: "dgx",
    cost: 8e4,
    maintenanceCost: 80
  },
  {
    id: "node_8_nvswitch1",
    name: "8-GPU NVSwitch Gen1 \u670D\u52A1\u5668",
    slotCount: 8,
    interconnect: "NVSwitch",
    interconnectBandwidth: 900,
    powerSupplyKW: 10,
    maxPowerDrawKW: 8,
    nvswitchGeneration: 1,
    reliability: 94,
    nodeType: "hgx",
    cost: 12e4,
    maintenanceCost: 120
  },
  // ===== Tier 4：旗舰 =====
  {
    id: "node_8_nvswitch2",
    name: "8-GPU NVSwitch Gen2 \u670D\u52A1\u5668",
    slotCount: 8,
    interconnect: "NVSwitch",
    interconnectBandwidth: 1800,
    powerSupplyKW: 12,
    maxPowerDrawKW: 10,
    nvswitchGeneration: 2,
    reliability: 95,
    nodeType: "hgx",
    cost: 2e5,
    maintenanceCost: 200
  },
  {
    id: "node_8_nvswitch3",
    name: "8-GPU NVSwitch Gen3 \u670D\u52A1\u5668",
    slotCount: 8,
    interconnect: "NVSwitch",
    interconnectBandwidth: 3600,
    powerSupplyKW: 15,
    maxPowerDrawKW: 12,
    nvswitchGeneration: 3,
    reliability: 96,
    nodeType: "hgx",
    cost: 35e4,
    maintenanceCost: 350
  },
  {
    id: "node_16_hgx",
    name: "16-GPU NVSwitch \u8D85\u7EA7\u8282\u70B9",
    slotCount: 16,
    interconnect: "NVSwitch",
    interconnectBandwidth: 3600,
    powerSupplyKW: 30,
    maxPowerDrawKW: 28.8,
    nvswitchGeneration: 3,
    reliability: 95,
    nodeType: "hgx",
    cost: 6e5,
    maintenanceCost: 550
  },
  // ===== Tier 5：超大规模集群专用节点 =====
  {
    id: "node_72_nvswitch4",
    name: "72-GPU NVSwitch Gen4 \u673A\u67DC",
    slotCount: 72,
    interconnect: "NVSwitch",
    interconnectBandwidth: 7200,
    powerSupplyKW: 120,
    maxPowerDrawKW: 115.2,
    nvswitchGeneration: 4,
    reliability: 96,
    nodeType: "hgx",
    cost: 35e5,
    maintenanceCost: 3e3
  },
  {
    id: "node_256_optical",
    name: "256-GPU \u5149\u4E92\u8054\u8D85\u7EA7\u8282\u70B9",
    slotCount: 256,
    interconnect: "OpticalFabric",
    interconnectBandwidth: 25600,
    powerSupplyKW: 400,
    maxPowerDrawKW: 384,
    nvswitchGeneration: 4,
    reliability: 97,
    nodeType: "hgx",
    cost: 15e6,
    maintenanceCost: 12e3
  }
];
var NODE_MAP = new Map(NODE_TEMPLATES.map((t) => [t.id, t]));
function getNodeTemplate(id) {
  return NODE_MAP.get(id);
}
var CLUSTER_NETWORKS = [
  // ===== 以太网路线 =====
  {
    id: "eth_100g",
    name: "Ethernet 100G",
    switchCapacity: 100,
    networkBandwidth: 12.5,
    costPerNode: 2e3,
    operationalCostPerDay: 8,
    utilizationBonus: 0.02,
    maxNodes: 32,
    maxTPDegree: 1,
    networkTopology: "simple",
    allReduceBandwidth: 8,
    parallelEfficiencyBase: 0.92
  },
  {
    id: "eth_400g",
    name: "Ethernet 400G",
    switchCapacity: 400,
    networkBandwidth: 50,
    costPerNode: 5e3,
    operationalCostPerDay: 15,
    utilizationBonus: 0.05,
    maxNodes: 64,
    maxTPDegree: 1,
    networkTopology: "simple",
    allReduceBandwidth: 32,
    parallelEfficiencyBase: 0.93
  },
  // ===== RoCE 路线 =====
  {
    id: "roce_200g",
    name: "RoCE 200G",
    switchCapacity: 200,
    networkBandwidth: 25,
    costPerNode: 4e3,
    operationalCostPerDay: 12,
    utilizationBonus: 0.06,
    maxNodes: 48,
    maxTPDegree: 1,
    networkTopology: "fat_tree",
    allReduceBandwidth: 18,
    parallelEfficiencyBase: 0.94
  },
  {
    id: "roce_400g",
    name: "RoCE 400G",
    switchCapacity: 400,
    networkBandwidth: 50,
    costPerNode: 8e3,
    operationalCostPerDay: 20,
    utilizationBonus: 0.08,
    maxNodes: 96,
    maxTPDegree: 2,
    networkTopology: "fat_tree",
    allReduceBandwidth: 36,
    parallelEfficiencyBase: 0.95
  },
  // ===== InfiniBand 路线 =====
  {
    id: "ib_hdr",
    name: "InfiniBand HDR",
    switchCapacity: 200,
    networkBandwidth: 25,
    costPerNode: 8e3,
    operationalCostPerDay: 20,
    utilizationBonus: 0.08,
    maxNodes: 64,
    maxTPDegree: 2,
    networkTopology: "fat_tree",
    allReduceBandwidth: 20,
    parallelEfficiencyBase: 0.955
  },
  {
    id: "ib_ndr",
    name: "InfiniBand NDR",
    switchCapacity: 400,
    networkBandwidth: 50,
    costPerNode: 15e3,
    operationalCostPerDay: 30,
    utilizationBonus: 0.12,
    maxNodes: 128,
    maxTPDegree: 4,
    networkTopology: "dragonfly",
    allReduceBandwidth: 44,
    parallelEfficiencyBase: 0.965
  },
  {
    id: "ib_xdr",
    name: "InfiniBand XDR",
    switchCapacity: 800,
    networkBandwidth: 100,
    costPerNode: 3e4,
    operationalCostPerDay: 55,
    utilizationBonus: 0.16,
    maxNodes: 256,
    maxTPDegree: 8,
    networkTopology: "dragonfly",
    allReduceBandwidth: 90,
    parallelEfficiencyBase: 0.975
  },
  {
    id: "ib_gdr",
    name: "InfiniBand GDR",
    switchCapacity: 1600,
    networkBandwidth: 200,
    costPerNode: 55e3,
    operationalCostPerDay: 100,
    utilizationBonus: 0.2,
    maxNodes: 512,
    maxTPDegree: 16,
    networkTopology: "rail_optimized",
    allReduceBandwidth: 185,
    parallelEfficiencyBase: 0.985
  },
  // ===== 超大规模集群路线（10万~百万卡级） =====
  {
    id: "3d_torus_ib",
    name: "3D-Torus InfiniBand",
    switchCapacity: 3200,
    networkBandwidth: 400,
    costPerNode: 12e4,
    operationalCostPerDay: 200,
    utilizationBonus: 0.25,
    maxNodes: 2048,
    // 2048 节点 × 16 卡 = 32767 卡
    maxTPDegree: 32,
    networkTopology: "3d_torus",
    allReduceBandwidth: 380,
    parallelEfficiencyBase: 0.99
  },
  {
    id: "optical_mesh",
    name: "\u5149\u4E92\u8054\u5168\u4E92\u8054\u7F51\u7EDC",
    switchCapacity: 6400,
    networkBandwidth: 800,
    costPerNode: 25e4,
    operationalCostPerDay: 400,
    utilizationBonus: 0.3,
    maxNodes: 8192,
    // 8192 节点 × 72 卡 = 589824 卡（10万卡级）
    maxTPDegree: 64,
    networkTopology: "optical_mesh",
    allReduceBandwidth: 760,
    parallelEfficiencyBase: 0.995
  },
  {
    id: "optical_mesh_plus",
    name: "\u9AD8\u7EA7\u5149\u4E92\u8054\u5168\u4E92\u8054\u7F51\u7EDC",
    switchCapacity: 12800,
    networkBandwidth: 1600,
    costPerNode: 5e5,
    operationalCostPerDay: 800,
    utilizationBonus: 0.35,
    maxNodes: 16384,
    // 16384 节点 × 256 卡 = 4194304 卡（百万卡级）
    maxTPDegree: 128,
    networkTopology: "hybrid_fabric",
    allReduceBandwidth: 1500,
    parallelEfficiencyBase: 0.998
  }
];
var NETWORK_MAP = new Map(CLUSTER_NETWORKS.map((n) => [n.id, n]));
function getClusterNetwork(id) {
  return NETWORK_MAP.get(id);
}
var DATA_CENTER_LOCATIONS = [
  {
    id: "nv_us",
    name: "\u5185\u534E\u8FBE, \u5408\u4F17\u56FD",
    powerCostPerKWh: 0.08,
    buildCostPerMW: 8e6,
    maintenanceCostPerDay: 500,
    climateFactor: 1.02
  },
  {
    id: "or_us",
    name: "\u4FC4\u52D2\u5188, \u5408\u4F17\u56FD",
    powerCostPerKWh: 0.06,
    buildCostPerMW: 7e6,
    maintenanceCostPerDay: 400,
    climateFactor: 0.99
  },
  {
    id: "iceland",
    name: "\u51B0\u5C9B",
    powerCostPerKWh: 0.05,
    buildCostPerMW: 9e6,
    maintenanceCostPerDay: 600,
    climateFactor: 0.97
  },
  {
    id: "singapore",
    name: "\u65B0\u52A0\u5761",
    powerCostPerKWh: 0.15,
    buildCostPerMW: 12e6,
    maintenanceCostPerDay: 800,
    climateFactor: 1.08
  }
];
var LOCATION_MAP = new Map(DATA_CENTER_LOCATIONS.map((l) => [l.id, l]));
function getDataCenterLocation(id) {
  return LOCATION_MAP.get(id);
}
var COOLING_TYPES = [
  {
    id: "air",
    name: "\u98CE\u51B7",
    basePUE: 1.4,
    utilizationBonus: 0,
    extraBuildCostPerMW: 0
  },
  {
    id: "liquid",
    name: "\u6DB2\u51B7",
    basePUE: 1.2,
    utilizationBonus: 0.05,
    extraBuildCostPerMW: 5e5
  },
  {
    id: "immersion",
    name: "\u6D78\u6CA1\u5F0F\u51B7\u5374",
    basePUE: 1.05,
    utilizationBonus: 0.1,
    extraBuildCostPerMW: 15e5
  }
];
var COOLING_MAP = new Map(COOLING_TYPES.map((c) => [c.id, c]));
function getCoolingType(id) {
  return COOLING_MAP.get(id);
}
var STORAGE_CONFIGS = [
  { id: "local_ssd", name: "\u672C\u5730 SSD", io: 1, capacity: 10, costPerDay: 5, upgradeCostPerNode: 0 },
  { id: "nvme_raid", name: "NVMe RAID", io: 5, capacity: 50, costPerDay: 10, upgradeCostPerNode: 5e3 },
  { id: "distributed_fs", name: "\u5206\u5E03\u5F0F\u6587\u4EF6\u7CFB\u7EDF", io: 100, capacity: 500, costPerDay: 30, upgradeCostPerNode: 1e4 },
  { id: "all_flash_cluster", name: "\u5168\u95EA\u5B58\u96C6\u7FA4", io: 500, capacity: 2e3, costPerDay: 80, upgradeCostPerNode: 2e4 }
];
var STORAGE_MAP = new Map(STORAGE_CONFIGS.map((s) => [s.id, s]));
function getStorageConfig(id) {
  return STORAGE_MAP.get(id);
}

// ../../src/core/utils/computeUtilization.ts
function calcClusterTotalTflops(data) {
  let total = 0;
  for (const modelId of Object.keys(data.resourceMeta)) {
    const pool = data.resourceMeta[modelId];
    if (!pool || !Array.isArray(pool)) continue;
    const spec = getCardSpec(modelId);
    if (!spec) continue;
    for (const card of pool) {
      if (card.status === "online") {
        total += spec.tflopsPerCard;
      }
    }
  }
  return total;
}
function calcActualPowerDraw(cardSpecs, workload) {
  const factor = workload === "idle" ? 0.1 : workload === "inference" ? 0.65 : 0.95;
  return cardSpecs.reduce((sum, s) => sum + s.maxPowerDrawKW * factor, 0);
}
function estimateRequiredMemory(model) {
  const paramsInBillions = model.paramCount;
  const weightMemory = paramsInBillions * 2;
  const activationMemory = weightMemory * 2.2;
  return weightMemory + activationMemory;
}
function calcInterconnectPenalty(requiresParallel, parallelSize, cardSpecs) {
  if (!requiresParallel || cardSpecs.length === 0) return 0;
  const requiredBW = parallelSize * 50;
  const actualBW = Math.min(
    ...cardSpecs.map((s) => s.nvlinkBandwidth > 0 ? s.nvlinkBandwidth : s.memoryBandwidth / 4)
  );
  if (actualBW <= 0) return 0.3;
  const ratio = requiredBW / actualBW;
  if (ratio < 1) return 0;
  if (ratio < 2) return (1 - 1 / ratio) * 0.15;
  return 0.3;
}
function calcCrossNodePenalty(requiresParallel, parallelSize, crossNode, cluster) {
  if (!requiresParallel || !crossNode || !cluster) return 0;
  const topologyFactor = cluster.networkTopology === "simple" ? 1.5 : cluster.networkTopology === "fat_tree" ? 1.15 : cluster.networkTopology === "dragonfly" ? 1.05 : 1;
  const requiredBW = parallelSize * 20;
  const actualBW = cluster.allReduceBandwidth / topologyFactor;
  if (actualBW <= 0) return 0.4;
  const ratio = requiredBW / actualBW;
  if (ratio < 1) return 0;
  if (ratio < 2) return (1 - 1 / ratio) * 0.2;
  return 0.4;
}
function calcScalePenalty(totalGpus, topology) {
  if (totalGpus <= 8) return 1;
  if (totalGpus <= 64) return Math.max(1 - Math.log(totalGpus / 8) * 0.02, 0.7);
  if (totalGpus <= 512) return Math.max(1 - Math.log(totalGpus / 64) * 0.04, 0.7);
  const isAdvanced = topology === "3d_torus" || topology === "optical_mesh" || topology === "hybrid_fabric";
  if (isAdvanced) {
    if (totalGpus <= 32768) return Math.max(1 - Math.log(totalGpus / 512) * 0.03, 0.55);
    return Math.max(1 - Math.log(totalGpus / 32768) * 0.02, 0.45);
  }
  return Math.max(1 - Math.log(totalGpus / 512) * 0.06, 0.7);
}
function calcHomogeneityFactor(cardSpecs) {
  if (cardSpecs.length <= 1) return 1;
  const resourceIds = new Set(cardSpecs.map((s) => s.resourceId));
  if (resourceIds.size === 1) return 1;
  const powers = cardSpecs.map((s) => s.maxPowerDrawKW);
  const minPower = Math.min(...powers);
  const maxPower = Math.max(...powers);
  const ratio = minPower / maxPower;
  if (ratio >= 0.8) return 0.98;
  if (ratio >= 0.5) return 0.93;
  return 0.85;
}
function calcPowerFactor(totalPowerMW, maxPowerMW) {
  if (totalPowerMW > maxPowerMW) return 0.5;
  if (totalPowerMW > 0.95 * maxPowerMW) return 1 - (totalPowerMW / maxPowerMW - 0.95) * 8;
  if (totalPowerMW > 0.85 * maxPowerMW) return 1 - (totalPowerMW / maxPowerMW - 0.85) * 2;
  return 1;
}
function calcPPEfficiency(ppStages) {
  if (ppStages <= 1) return 1;
  return clamp((ppStages + 1) / (2 * ppStages), 0.4, 1);
}
function calcTPEfficiency(tpSize, cardSpecs) {
  if (tpSize <= 1) return 1;
  const minNVLinkGen = Math.min(
    ...cardSpecs.map((s) => {
      const gen = parseInt((s.interconnect ?? "").replace("NVLink", ""), 10);
      return isNaN(gen) ? 0 : gen;
    })
  );
  const perCardOverhead = minNVLinkGen >= 4 ? 0.03 : minNVLinkGen >= 1 ? 0.06 : 0.12;
  return clamp(1 - (tpSize - 1) * perCardOverhead, 0.4, 1);
}
function calcDPEfficiency(dpReplicas) {
  if (dpReplicas <= 1) return 1;
  return clamp(1 - Math.log2(dpReplicas) * 0.02, 0.6, 1);
}
function calcEPEfficiency(epGroups) {
  if (epGroups <= 1) return 1;
  return clamp(1 - 0.05 - (epGroups - 1) * 0.02, 0.6, 1);
}
function calcCPEfficiency(cpSize) {
  if (cpSize <= 1) return 1;
  return clamp(1 - Math.log2(cpSize) * 0.03, 0.5, 1);
}
function calcParallelStrategyEfficiency(parallelConfig, cardSpecs, architecture) {
  const pp = parallelConfig.ppStages > 1 ? calcPPEfficiency(parallelConfig.ppStages) : 1;
  const tp = parallelConfig.tpSize > 1 ? calcTPEfficiency(parallelConfig.tpSize, cardSpecs) : 1;
  const dp = parallelConfig.dpReplicas > 1 ? calcDPEfficiency(parallelConfig.dpReplicas) : 1;
  const ep = parallelConfig.epGroups > 1 && architecture === "moe" ? calcEPEfficiency(parallelConfig.epGroups) : 1;
  const cp = parallelConfig.cpSize > 1 ? calcCPEfficiency(parallelConfig.cpSize) : 1;
  return pp * tp * dp * ep * cp;
}
function calcParallelMemoryReduction(parallelConfig) {
  const pp = parallelConfig.ppStages > 1 ? parallelConfig.ppStages : 1;
  const tp = parallelConfig.tpSize > 1 ? parallelConfig.tpSize : 1;
  return pp * tp;
}
function calculateEffectiveCompute(cardSpecs, cluster, dc, techEffects = [], modelParams, maxSlotsPerNode = 8) {
  const totalTflops = cardSpecs.reduce((sum, s) => sum + s.tflopsPerCard, 0);
  if (cardSpecs.length === 0 || totalTflops === 0) {
    return {
      totalTflops: 0,
      effectiveTflops: 0,
      utilization: 0,
      requiresParallel: false,
      parallelSize: 0,
      interconnectPenalty: 0,
      crossNodePenalty: 0,
      scalePenalty: 1,
      homogeneityFactor: 1,
      actualPowerKW: 0,
      powerUtilization: 0
    };
  }
  const bottlenecks = [];
  let softwareUtil = 0.4 + aggregateMultiplicative(
    techEffects,
    "improve_utilization",
    TECH_EFFECT_CAPS.improve_utilization
  );
  softwareUtil = clamp(softwareUtil, 0, 0.95);
  let clusterUtil = 0.9;
  if (cluster) {
    clusterUtil = 0.9 + cluster.utilizationBonus;
  }
  clusterUtil = clamp(clusterUtil, 0, 1);
  let coolingBonus = 0;
  if (dc) {
    const cooling = getCoolingType(dc.coolingType);
    if (cooling) {
      coolingBonus = cooling.utilizationBonus;
    }
    const pueDegradation = dc.currentPue - dc.basePue;
    if (pueDegradation > 0) {
      coolingBonus -= pueDegradation * 0.5;
    }
  }
  let powerFactor = 1;
  let actualPowerKW = 0;
  let powerUtilization = 0;
  if (dc) {
    actualPowerKW = calcActualPowerDraw(cardSpecs, "training");
    const actualPowerMW = actualPowerKW / 1e3;
    powerUtilization = dc.maxPowerMW > 0 ? actualPowerMW / dc.maxPowerMW : 0;
    powerFactor = calcPowerFactor(actualPowerMW, dc.maxPowerMW);
    if (powerFactor < 1) {
      if (powerFactor <= 0.5) {
        bottlenecks.push("\u7535\u529B\u8FC7\u8F7D");
      } else {
        bottlenecks.push("\u7535\u529B\u63A5\u8FD1\u4E0A\u9650");
      }
    }
  }
  let parallelEfficiency = 1;
  let requiresParallel = false;
  let parallelSize = 1;
  let strategyEfficiency = 1;
  let parallelMemReduction = 1;
  if (modelParams) {
    const pc = modelParams.parallelConfig;
    if (pc) {
      parallelMemReduction = calcParallelMemoryReduction(pc);
      strategyEfficiency = calcParallelStrategyEfficiency(pc, cardSpecs, modelParams.architecture);
    }
    const requiredMem = estimateRequiredMemory(modelParams) / parallelMemReduction;
    const minCardMem = Math.min(...cardSpecs.map((s) => s.memoryGB));
    if (requiredMem > minCardMem) {
      requiresParallel = true;
      parallelSize = Math.ceil(requiredMem / minCardMem);
      parallelSize = Math.min(parallelSize, cardSpecs.length);
      let perCardLoss = 0.03;
      const parallelEffBonus = aggregateMultiplicative(
        techEffects,
        "improve_parallel_efficiency",
        TECH_EFFECT_CAPS.improve_parallel_efficiency
      );
      perCardLoss = Math.max(5e-3, perCardLoss - parallelEffBonus);
      const extraCards = parallelSize - 1;
      parallelEfficiency = clamp(1 - extraCards * perCardLoss, 0.3, 1);
      if (pc && (pc.ppStages > 1 || pc.tpSize > 1)) {
        bottlenecks.push(`${pc.ppStages > 1 ? `PP\xD7${pc.ppStages}` : ""}${pc.ppStages > 1 && pc.tpSize > 1 ? "+" : ""}${pc.tpSize > 1 ? `TP\xD7${pc.tpSize}` : ""}\u5E76\u884C (${parallelSize} \u5361)`);
      } else {
        bottlenecks.push(`\u6A21\u578B\u5E76\u884C (${parallelSize} \u5361)`);
      }
    } else if (pc && (pc.ppStages > 1 || pc.tpSize > 1 || pc.epGroups > 1 || pc.cpSize > 1)) {
      bottlenecks.push(`\u9AD8\u7EA7\u5E76\u884C\uFF08\u663E\u5B58\u5145\u88D5\uFF0C\u4EC5\u6548\u7387\u5F71\u54CD\uFF09`);
    }
  }
  if (cluster) {
    parallelEfficiency *= cluster.parallelEfficiencyBase;
  }
  if (requiresParallel && cardSpecs.length > 1) {
    const minBandwidth = Math.min(...cardSpecs.map((s) => s.memoryBandwidth));
    if (minBandwidth < 1e3) {
      parallelEfficiency *= 0.9;
      bottlenecks.push("\u4E92\u8054\u5E26\u5BBD\u4E0D\u8DB3");
    }
  }
  const interconnectPenalty = calcInterconnectPenalty(requiresParallel, parallelSize, cardSpecs);
  if (interconnectPenalty > 0) {
    bottlenecks.push("\u4E92\u8054\u5E26\u5BBD\u74F6\u9888");
  }
  const crossNode = requiresParallel && parallelSize > maxSlotsPerNode;
  const crossNodePenalty = calcCrossNodePenalty(requiresParallel, parallelSize, crossNode, cluster);
  if (crossNodePenalty > 0) {
    bottlenecks.push("\u8DE8\u8282\u70B9\u901A\u4FE1\u74F6\u9888");
  }
  const scalePenalty = calcScalePenalty(cardSpecs.length, cluster?.networkTopology);
  if (scalePenalty < 1) {
    bottlenecks.push(`\u89C4\u6A21\u60E9\u7F5A (${(scalePenalty * 100).toFixed(1)}%)`);
  }
  const homogeneityFactor = calcHomogeneityFactor(cardSpecs);
  if (homogeneityFactor < 1) {
    bottlenecks.push("\u5F02\u6784\u96C6\u7FA4");
  }
  const utilization = clamp(
    softwareUtil * clusterUtil * (1 + coolingBonus) * powerFactor * parallelEfficiency * strategyEfficiency * (1 - interconnectPenalty) * (1 - crossNodePenalty) * scalePenalty * homogeneityFactor,
    0,
    0.98
  );
  const effectiveTflops = totalTflops * utilization;
  return {
    totalTflops,
    effectiveTflops,
    utilization,
    bottleneck: bottlenecks.length > 0 ? bottlenecks.join("; ") : void 0,
    requiresParallel,
    parallelSize,
    interconnectPenalty,
    crossNodePenalty,
    scalePenalty,
    homogeneityFactor,
    actualPowerKW,
    powerUtilization
  };
}

// ../../src/core/config/capabilities.ts
var CAPABILITIES = [
  // ===== 显性维度 =====
  {
    id: "dialogue_fluency",
    name: "\u5BF9\u8BDD\u6D41\u7545\u5EA6",
    visible: true,
    inverse: false,
    baseNoiseSigma: 15,
    minNoiseSigma: 5,
    primaryDataDomains: ["dialogue", "web"],
    emergenceThreshold: 600,
    contextThreshold: 2048
  },
  {
    id: "world_knowledge",
    name: "\u4E16\u754C\u77E5\u8BC6",
    visible: true,
    inverse: false,
    baseNoiseSigma: 15,
    minNoiseSigma: 5,
    primaryDataDomains: ["web", "books", "science"],
    emergenceThreshold: 900,
    contextThreshold: 8192
  },
  {
    id: "math_reasoning",
    name: "\u6570\u5B66\u4E0E\u63A8\u7406",
    visible: true,
    inverse: false,
    baseNoiseSigma: 10,
    minNoiseSigma: 4,
    primaryDataDomains: ["math"],
    emergenceThreshold: 1100,
    contextThreshold: 16384
  },
  {
    id: "coding_agent",
    name: "Coding/Agent",
    visible: true,
    inverse: false,
    baseNoiseSigma: 15,
    minNoiseSigma: 5,
    primaryDataDomains: ["code"],
    emergenceThreshold: 1100,
    contextThreshold: 32768
  },
  {
    id: "multilingual",
    name: "\u591A\u8BED\u8A00",
    visible: true,
    inverse: false,
    baseNoiseSigma: 15,
    minNoiseSigma: 5,
    primaryDataDomains: ["multilingual"],
    emergenceThreshold: 1100,
    contextThreshold: 16384
  },
  {
    id: "multimodal",
    name: "\u591A\u6A21\u6001",
    visible: true,
    inverse: false,
    baseNoiseSigma: 15,
    minNoiseSigma: 6,
    primaryDataDomains: ["multimodal"],
    emergenceThreshold: 1500,
    contextThreshold: 1048576
  },
  {
    id: "hallucination_rate",
    name: "\u5E7B\u89C9\u7387",
    visible: true,
    inverse: true,
    baseNoiseSigma: 15,
    minNoiseSigma: 5,
    primaryDataDomains: ["web", "books"],
    emergenceThreshold: 600,
    contextThreshold: 8192
  },
  // ===== 隐性维度 =====
  {
    id: "self_correction",
    name: "\u81EA\u6211\u7EA0\u9519",
    visible: false,
    inverse: false,
    baseNoiseSigma: 40,
    minNoiseSigma: 15,
    primaryDataDomains: ["rl_data", "user_feedback"],
    emergenceThreshold: 1500,
    contextThreshold: 65536
  },
  {
    id: "research_taste",
    name: "\u79D1\u7814\u54C1\u5473",
    visible: false,
    inverse: false,
    baseNoiseSigma: 50,
    minNoiseSigma: 20,
    primaryDataDomains: ["science", "books"],
    emergenceThreshold: 1700,
    contextThreshold: 131072
  },
  {
    id: "pragmatic_inference",
    name: "\u8BED\u7528\u63A8\u65AD",
    visible: false,
    inverse: false,
    baseNoiseSigma: 40,
    minNoiseSigma: 15,
    primaryDataDomains: ["dialogue", "books"],
    emergenceThreshold: 1400,
    contextThreshold: 65536
  },
  {
    id: "creative_writing",
    name: "\u521B\u610F\u5199\u4F5C",
    visible: false,
    inverse: false,
    baseNoiseSigma: 50,
    minNoiseSigma: 20,
    primaryDataDomains: ["books", "dialogue"],
    emergenceThreshold: 1300,
    contextThreshold: 32768
  },
  {
    id: "long_range_coherence",
    name: "\u957F\u7A0B\u4E00\u81F4\u6027",
    visible: false,
    inverse: false,
    baseNoiseSigma: 35,
    minNoiseSigma: 12,
    primaryDataDomains: ["books", "science"],
    emergenceThreshold: 1750,
    contextThreshold: 131072
  },
  {
    id: "metacognition",
    name: "\u5143\u8BA4\u77E5",
    visible: false,
    inverse: false,
    baseNoiseSigma: 45,
    minNoiseSigma: 18,
    primaryDataDomains: ["rl_data", "science"],
    emergenceThreshold: 1700,
    contextThreshold: 131072
  },
  {
    id: "sycophancy",
    name: "\u8C04\u5A9A/\u6B3A\u9A97\u6027",
    visible: false,
    inverse: true,
    baseNoiseSigma: 40,
    minNoiseSigma: 15,
    primaryDataDomains: ["user_feedback", "dialogue"],
    emergenceThreshold: 1e3,
    contextThreshold: 8192
  },
  {
    id: "eval_awareness",
    name: "\u8BC4\u4F30\u610F\u8BC6",
    visible: false,
    inverse: true,
    baseNoiseSigma: 50,
    minNoiseSigma: 20,
    primaryDataDomains: ["web", "code"],
    emergenceThreshold: 1200,
    contextThreshold: 16384
  },
  {
    id: "rsi_potential",
    name: "RSI\u6F5C\u529B",
    visible: false,
    inverse: false,
    baseNoiseSigma: 60,
    minNoiseSigma: 25,
    primaryDataDomains: ["rl_data", "science", "code"],
    emergenceThreshold: 2200,
    contextThreshold: 4194304
  }
];
var CAPABILITY_MAP = Object.fromEntries(CAPABILITIES.map((c) => [c.id, c]));

// ../../src/core/utils/capabilityCalc.ts
var DEFAULT_BASE_SCORE_PARAMS = {
  E: 1,
  A: 400,
  B: 400,
  alpha: 1 / 3,
  beta: 1 / 3
};
function calcBaseScore(paramCount, effectiveTokens, params = DEFAULT_BASE_SCORE_PARAMS) {
  const { E, A, B, alpha, beta } = params;
  const nTerm = A / Math.pow(Math.max(paramCount, 1), alpha);
  const dTerm = B / Math.pow(Math.max(effectiveTokens, 1), beta);
  const denom = E + nTerm + dTerm;
  const ratio = E / denom;
  if (ratio >= 1) return 9999;
  if (ratio <= 0) return 0;
  return -Math.log10(1 - ratio) * 1e3;
}
function deriveBaseScoreParams(effects) {
  const p = { ...DEFAULT_BASE_SCORE_PARAMS };
  p.E += aggregateAdditive(effects, "modify_base_score_E", {
    maxCap: TECH_EFFECT_CAPS.modify_base_score_E,
    minCap: -TECH_EFFECT_CAPS.modify_base_score_E
  });
  p.A += aggregateAdditive(effects, "modify_base_score_A", {
    maxCap: TECH_EFFECT_CAPS.modify_base_score_A,
    minCap: -TECH_EFFECT_CAPS.modify_base_score_A
  });
  p.B += aggregateAdditive(effects, "modify_base_score_B", {
    maxCap: TECH_EFFECT_CAPS.modify_base_score_B,
    minCap: -TECH_EFFECT_CAPS.modify_base_score_B
  });
  p.alpha += aggregateAdditive(effects, "modify_alpha", {
    maxCap: TECH_EFFECT_CAPS.modify_alpha,
    minCap: -TECH_EFFECT_CAPS.modify_alpha
  });
  p.beta += aggregateAdditive(effects, "modify_beta", {
    maxCap: TECH_EFFECT_CAPS.modify_beta,
    minCap: -TECH_EFFECT_CAPS.modify_beta
  });
  p.E = Math.max(0.1, p.E);
  p.A = Math.max(0.1, p.A);
  p.B = Math.max(0.1, p.B);
  return p;
}
function calcContextFactor(contextLength, threshold) {
  if (contextLength <= 1) return 0;
  if (threshold <= 1) return 1;
  const x = contextLength < threshold ? 1.25 : 0.25;
  const ratio = Math.log10(contextLength) / Math.log10(threshold);
  return Math.pow(Math.max(ratio, 0), x);
}
function calcEmergencePenalty(baseScore, threshold) {
  if (baseScore >= threshold) return baseScore;
  if (baseScore <= 0) return 0;
  return baseScore * Math.pow(baseScore / threshold, 5);
}
function calcDataQualityBonus(capability, dataset) {
  let totalTokens = 0;
  let weightedQuality = 0;
  for (const domainId of capability.primaryDataDomains) {
    const domain = dataset.domains[domainId];
    if (!domain) continue;
    const effectiveTokens = domain.tokens * (1 - domain.duplication);
    totalTokens += effectiveTokens;
    weightedQuality += effectiveTokens * domain.quality;
  }
  if (totalTokens === 0) return 0.5;
  const avgQuality = weightedQuality / totalTokens;
  return 0.5 + avgQuality;
}
function collectCapabilityBonuses(effects) {
  const aggregated = aggregateCapabilityBonuses(effects, TECH_EFFECT_CAPS.capability_bonus);
  const bonuses = {};
  for (const [capId, value] of Object.entries(aggregated)) {
    bonuses[capId] = value;
  }
  return bonuses;
}
function calculateCapabilities(baseScore, contextLength, dataset, archMatrix, techIds, techEffects) {
  const capabilities = {};
  const rawCapabilities = {};
  const capabilityBonuses = collectCapabilityBonuses(techEffects);
  for (const def of CAPABILITIES) {
    const ctxFactor = calcContextFactor(contextLength, def.contextThreshold);
    const dataBonus = calcDataQualityBonus(def, dataset);
    let archBonus = 1;
    for (const techId of techIds) {
      const archEntry = archMatrix[techId];
      if (archEntry && archEntry[def.id]) {
        archBonus += archEntry[def.id];
      }
    }
    let techBonus = 1;
    if (capabilityBonuses[def.id]) {
      techBonus += capabilityBonuses[def.id];
    }
    const rawCapability = baseScore * ctxFactor * dataBonus * archBonus * techBonus;
    const capability = calcEmergencePenalty(rawCapability, def.emergenceThreshold);
    rawCapabilities[def.id] = Math.max(0, rawCapability);
    capabilities[def.id] = Math.max(0, capability);
  }
  return { capabilities, rawCapabilities };
}
function calcTrainingCompute(paramCount, trainingTokens, contextLength) {
  if (paramCount <= 0 || trainingTokens <= 0) return 0;
  const d = 2 * Math.pow(paramCount, 1 / 3);
  const flops = 6 * paramCount * trainingTokens * (1 + contextLength / (4 * d));
  return flops / (1e12 * 86400);
}

// ../../src/core/utils/cloudComputeUtils.ts
function getActiveCloudContracts(data) {
  const contracts = data.resourceMeta["cloud_rental_contracts"];
  if (!Array.isArray(contracts)) return [];
  return contracts.filter((c) => c.expiresAt > data.date);
}
function getActiveCloudTFLOPS(data) {
  return getActiveCloudContracts(data).reduce((s, c) => s + c.tflops, 0);
}

// ../../src/core/utils/cardIndex.ts
var indexCache = /* @__PURE__ */ new WeakMap();
function getCardIndex(data) {
  const meta = data.resourceMeta;
  let index = indexCache.get(meta);
  if (index !== void 0) return index;
  index = /* @__PURE__ */ new Map();
  for (const modelId of Object.keys(data.resourceMeta)) {
    const pool = data.resourceMeta[modelId];
    if (!pool || !Array.isArray(pool)) continue;
    for (const card of pool) {
      index.set(card.uid, { card, modelId });
    }
  }
  indexCache.set(meta, index);
  return index;
}

// ../../src/core/config/researchConfig.ts
var EXPERIMENT_VALIDATION = {
  /** 小实验算力成本占主力训练的比例 */
  smallExperimentRatio: 0.05,
  /** 中型实验算力成本占主力训练的比例 */
  mediumExperimentRatio: 0.15,
  /** 小实验噪声σ */
  smallNoiseSigma: 0.08,
  /** 中型实验噪声σ */
  mediumNoiseSigma: 0.04,
  /** 小实验模型规模（参数量比例） */
  smallModelScale: 0.1,
  /** 中型实验模型规模 */
  mediumModelScale: 0.3,
  /** 小实验每日推进进度 */
  smallDailyProgress: 0.15,
  /** 中型实验每日推进进度 */
  mediumDailyProgress: 0.08
};
var RESEARCH_CONFIG = {
  maxConcurrentProjects: 3
};
var EXPERIMENT_CONFIG = {
  /** 算力比例拉条下限（0.5%） */
  minComputeRatio: 5e-3,
  /** 算力比例拉条上限（50%） */
  maxComputeRatio: 0.5,
  /** 拉条步进（1%） */
  ratioStep: 0.01,
  /**
   * 实验目标参数量选项（单位：B）
   *
   * 从 0.5B 到 1T，覆盖从简单优化到 AI 自我改进的全部实验规模。
   */
  paramOptions: [0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024],
  /** 公式 B 基准：16B 实验的算力预算（TFLOPS·天） */
  budgetBase16B: 64e4,
  /** 公式 C 基准：16B 实验的资金成本（$） */
  costBase16B: 1e5,
  /** 公式 D：基础成熟度增益 */
  baseMaturityGain: 4,
  /** 公式 D：算力因子系数 computeFactor = 1 + log2(ratio×100) × computeFactorCoeff */
  computeFactorCoeff: 0.15,
  /** 公式 D：接近度因子系数 proximityFactor = 1 - 0.5 × (cur/maxCap) */
  proximityFactorCoeff: 0.5,
  /** 公式 D：研究员因子系数 researcherFactor = 1 + sumIntelligence / researcherFactorDenom */
  researcherFactorDenom: 200,
  /** 实验噪声σ（参数量越大，架构效果估计越精确） */
  baseNoiseSigma: 0.06,
  /**
   * 公式 A 参数：技术难易度 → P100（达到 100% 成熟度所需参数量 B）
   *
   * P100(difficulty) = difficulty³ × 0.5
   *
   * 数值表：
   * - diff 1:  0.5B 可达 100%
   * - diff 2:  4B 可达 100%
   * - diff 3:  13.5B 可达 100%
   * - diff 4:  32B 可达 100%
   * - diff 5:  62.5B 可达 100%
   * - diff 6:  108B 可达 100%
   * - diff 7:  171.5B 可达 100%
   * - diff 8:  256B 可达 100%
   * - diff 10: 500B 可达 100%
   * - diff 12: 864B 可达 100%
   * - diff 15: 1687.5B (~1.7T) 可达 100%
   */
  p100DifficultyCoeff: 0.5,
  p100DifficultyPower: 3
};
function calcMaxMaturityCap(params, difficulty = 1) {
  const p100 = Math.pow(difficulty, EXPERIMENT_CONFIG.p100DifficultyPower) * EXPERIMENT_CONFIG.p100DifficultyCoeff;
  if (params >= p100) return 100;
  return Math.min(100, 100 * Math.sqrt(params / p100));
}
function calcExperimentBudget(params) {
  return EXPERIMENT_CONFIG.budgetBase16B * Math.pow(params / 16, 2);
}
function calcExperimentFundsCost(params) {
  return Math.ceil(EXPERIMENT_CONFIG.costBase16B * Math.pow(params / 16, 2));
}
function calcMaturityGain(params, computeRatio, currentMaturity, sumIntelligence, difficulty = 1) {
  const maxCap = calcMaxMaturityCap(params, difficulty);
  const baseGain = EXPERIMENT_CONFIG.baseMaturityGain;
  const computeFactor = 1 + Math.sqrt(computeRatio * 2) * EXPERIMENT_CONFIG.computeFactorCoeff;
  const proximityFactor = 1 - EXPERIMENT_CONFIG.proximityFactorCoeff * (currentMaturity / Math.max(1, maxCap));
  const researcherFactor = 1 + sumIntelligence / EXPERIMENT_CONFIG.researcherFactorDenom;
  return baseGain * computeFactor * proximityFactor * researcherFactor;
}

// ../../src/core/utils/researchUtils.ts
function runExperiment(archTechId, archMatrix, scale, confidenceBonus = 0, techMaturity = 0) {
  const trueBonuses = archMatrix[archTechId] ?? {};
  const baseNoiseSigma = scale === "small" ? EXPERIMENT_VALIDATION.smallNoiseSigma : EXPERIMENT_VALIDATION.mediumNoiseSigma;
  const noiseSigma = baseNoiseSigma * (1 - Math.min(0.5, techMaturity / 200));
  const modelScale = scale === "small" ? EXPERIMENT_VALIDATION.smallModelScale : EXPERIMENT_VALIDATION.mediumModelScale;
  const estimatedBonuses = {};
  for (const capId of Object.keys(trueBonuses)) {
    const trueValue = trueBonuses[capId] ?? 0;
    const u1 = Math.max(1e-10, Math.random());
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    estimatedBonuses[capId] = trueValue + z * noiseSigma;
  }
  let matConfBonus = 0;
  if (techMaturity >= 100) matConfBonus = 0.2;
  else if (techMaturity >= 50) matConfBonus = 0.1;
  return {
    archTechId,
    estimatedBonuses,
    confidence: Math.max(0.1, Math.min(1, 1 - noiseSigma + confidenceBonus + matConfBonus)),
    modelScale,
    date: 0
  };
}
function aggregateExperiments(experiments, archTechId) {
  const exps = experiments.filter((e) => e.archTechId === archTechId);
  if (exps.length === 0) return {};
  const capIds = new Set(exps.flatMap((e) => Object.keys(e.estimatedBonuses)));
  const result = {};
  for (const capId of capIds) {
    let weightedSum = 0;
    let weightSum = 0;
    for (const exp of exps) {
      const val = exp.estimatedBonuses[capId];
      if (val !== void 0) {
        weightedSum += val * exp.confidence;
        weightSum += exp.confidence;
      }
    }
    if (weightSum > 0) {
      result[capId] = weightedSum / weightSum;
    }
  }
  return result;
}

// ../../src/core/systems/TrainingSystem.ts
function calcExpectedLoss(progress) {
  return 2.5 + 7.5 * Math.exp(-5 * progress);
}
function gaussianNoise(sigma) {
  const u1 = Math.max(Math.random(), 1e-10);
  const u2 = Math.random();
  return sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
function hasTechEffect(effects, type) {
  return effects.some((e) => e.type === type);
}
function hashStr(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i) | 0;
  }
  return hash;
}
var TrainingSystem = class {
  name = "TrainingSystem";
  update(state, events, deltaDays) {
    const current2 = state.read();
    const trainingProjects = current2.trainingProjects.filter((p) => p.status === "training");
    if (trainingProjects.length === 0) return;
    const completed = [];
    const progressInfo = [];
    const events_log = [];
    const pausedProjects = [];
    const releasedModels = [];
    const autoResumedProjects = [];
    const companyComputeReduction = getCompanyTrainingComputeReduction(current2);
    const cloudTFLOPS = getActiveCloudTFLOPS(current2);
    const activeTechEffects = getActiveTechEffects(current2);
    const experimentRatioSum = current2.researchProjects.filter((p) => p.status === "in_progress" && p.type === "experiment_validation" && p.computeRatio !== null).reduce((s, p) => s + (p.computeRatio ?? 0), 0);
    const experimentLoadFactor = Math.max(0, 1 - experimentRatioSum);
    state.update((draft) => {
      for (const project of draft.trainingProjects) {
        if (project.status === "paused" && project.autoResumeDay !== void 0 && draft.date >= project.autoResumeDay) {
          const specs = this.collectCardSpecs(draft, project);
          if (specs.length > 0) {
            project.status = "training";
            project.pauseReason = null;
            project.autoResumeDay = void 0;
            project.trainingLog.push({
              day: draft.date,
              event: "\u98CE\u9669\u6682\u505C\u671F\u6EE1\uFF0C\u81EA\u52A8\u6062\u590D\u8BAD\u7EC3",
              severity: "info"
            });
            autoResumedProjects.push({ id: project.id, modelName: project.modelName });
          }
        }
      }
      for (const project of draft.trainingProjects) {
        if (project.status !== "training") continue;
        const cardSpecs = this.collectCardSpecs(draft, project);
        if (cardSpecs.length === 0) {
          project.status = "paused";
          project.pauseReason = "\u65E0\u53EF\u7528\u8BA1\u7B97\u5361";
          pausedProjects.push({ id: project.id, reason: project.pauseReason });
          continue;
        }
        const cluster = draft.clusters.find((c) => c.id === project.clusterId) ?? void 0;
        const dc = cluster?.dataCenterId ? draft.dataCenters.find((d) => d.id === cluster.dataCenterId) : void 0;
        let maxSlotsPerNode = 8;
        if (cluster) {
          for (const nid of cluster.nodes) {
            const n = draft.serverNodes.find((x) => x.id === nid);
            if (n && n.slotCount > maxSlotsPerNode) maxSlotsPerNode = n.slotCount;
          }
        }
        const modelParams = {
          paramCount: project.paramCount,
          architecture: project.architecture,
          parallelConfig: project.parallelConfig
        };
        const result = calculateEffectiveCompute(
          cardSpecs,
          cluster,
          dc,
          activeTechEffects,
          modelParams,
          maxSlotsPerNode
        );
        const progressBefore = 1 - project.computeRemaining / project.computeTotal;
        const oldPhase = project.trainingPhase;
        if (progressBefore < 0.05) {
          project.trainingPhase = "warmup";
        } else if (progressBefore < 0.85) {
          project.trainingPhase = "main";
        } else {
          project.trainingPhase = "decay";
        }
        const phaseModifier = project.trainingPhase === "warmup" ? 0.7 : project.trainingPhase === "decay" ? 0.95 : 1;
        if (oldPhase !== project.trainingPhase) {
          const phaseNames = {
            warmup: "\u9884\u70ED\u671F",
            main: "\u4E3B\u8BAD\u7EC3\u671F",
            decay: "\u8870\u51CF\u671F"
          };
          project.trainingLog.push({
            day: draft.date,
            event: `\u8FDB\u5165${phaseNames[project.trainingPhase]}`,
            severity: "info"
          });
        }
        const staffSpeedMult = getStaffTrainingSpeedMultiplier(draft, project.id);
        const speedMultiplier = staffSpeedMult * (1 + companyComputeReduction);
        const cloudUtilization = 0.9;
        const cloudProgress = cloudTFLOPS * cloudUtilization * phaseModifier * deltaDays * speedMultiplier;
        const dailyProgress = result.effectiveTflops * experimentLoadFactor * phaseModifier * deltaDays * speedMultiplier + cloudProgress;
        project.computeRemaining = Math.max(0, project.computeRemaining - dailyProgress);
        const computeConsumedRatio = dailyProgress / Math.max(1, project.computeTotal);
        for (const techId of project.techIds) {
          const mat = draft.techMaturity[techId] ?? 0;
          if (mat >= 1 && mat < 100) {
            const gain = 0.15 * deltaDays + 1 * computeConsumedRatio;
            draft.techMaturity[techId] = Math.min(100, mat + gain);
          }
        }
        const progressAfter = 1 - project.computeRemaining / project.computeTotal;
        const expectedLoss = calcExpectedLoss(progressAfter);
        const techEffects = project.techIds.map((tid) => {
          const node = TECH_MAP[tid] ?? IDEA_TECH_MAP[tid];
          if (!node) return null;
          const mat = draft.techMaturity[tid] ?? 0;
          if (mat < 1) return null;
          return scaleTechEffect(node.effect, mat);
        }).filter((e) => e !== null);
        const hasGradientClipping = hasTechEffect(techEffects, "reduce_training_crash_risk") || project.techIds.includes("gradient_clipping");
        const hasStableTraining = project.techIds.includes("stable_training");
        const lossNoiseSigma = project.trainingPhase === "main" ? 0.15 : 0.08;
        let loss = expectedLoss + gaussianNoise(lossNoiseSigma);
        if (project.spikeRecoveryDays > 0) {
          project.spikeRecoveryDays = Math.max(0, project.spikeRecoveryDays - deltaDays);
        }
        const stabilityBonus = getStaffTrainingStabilityBonus(draft);
        const spikeProb = hasGradientClipping ? 0.01 * (1 - stabilityBonus) : 0.05 * (1 - stabilityBonus);
        if (Math.random() < spikeProb * deltaDays) {
          const spikeMagnitude = 0.5 + Math.random() * 1.5;
          loss += spikeMagnitude;
          project.lossSpikeCount++;
          project.stabilityScore = Math.max(0.3, project.stabilityScore - 0.02);
          project.spikeRecoveryDays = 2;
          project.trainingLog.push({
            day: draft.date,
            event: `\u635F\u5931\u5C16\u5CF0 +${spikeMagnitude.toFixed(2)}`,
            severity: "warning"
          });
          events_log.push({ id: project.id, day: draft.date, event: "\u635F\u5931\u5C16\u5CF0", severity: "warning" });
        }
        const explosionProb = hasStableTraining ? 1e-3 : 5e-3;
        if (Math.random() < explosionProb * deltaDays && progressAfter > 0.05) {
          const lostSinceCheckpoint = project.lastCheckpointRemaining - project.computeRemaining;
          project.computeRemaining = project.lastCheckpointRemaining;
          project.lostFlops += Math.abs(lostSinceCheckpoint);
          project.gradientExplosionCount++;
          project.stabilityScore = Math.max(0.3, project.stabilityScore - 0.1);
          loss = calcExpectedLoss(1 - project.computeRemaining / project.computeTotal) + 2;
          project.trainingLog.push({
            day: draft.date,
            event: `\u68AF\u5EA6\u7206\u70B8\uFF01\u56DE\u9000\u5230\u68C0\u67E5\u70B9\uFF0C\u635F\u5931 ${Math.abs(lostSinceCheckpoint).toFixed(0)} TFLOPS\xB7\u5929`,
            severity: "critical"
          });
          events_log.push({ id: project.id, day: draft.date, event: "\u68AF\u5EA6\u7206\u70B8", severity: "critical" });
        }
        const valLoss = loss + gaussianNoise(0.2) + 0.1;
        project.currentLoss = Math.max(1.5, loss);
        project.validationLoss = Math.max(1.5, valLoss);
        project.lossHistory.push({
          day: draft.date,
          progress: progressAfter,
          loss: project.currentLoss,
          valLoss: project.validationLoss
        });
        if (project.lossHistory.length > 100) {
          project.lossHistory.shift();
        }
        const progressSinceCheckpoint = project.lastCheckpointRemaining - project.computeRemaining;
        if (progressSinceCheckpoint >= project.checkpointInterval) {
          project.lastCheckpointRemaining = project.computeRemaining;
          project.lastCheckpointDay = draft.date;
          project.trainingLog.push({
            day: draft.date,
            event: "\u68C0\u67E5\u70B9\u5DF2\u4FDD\u5B58",
            severity: "info"
          });
        }
        if (project.trainingLog.length > 50) {
          project.trainingLog = project.trainingLog.slice(-50);
        }
        if (project.computeRemaining <= 0) {
          project.status = "completed";
          project.completedAt = draft.date;
          completed.push({ id: project.id, modelName: project.modelName });
          const releaseIndex = getCardIndex(draft);
          for (const cardUids of Object.values(project.nodeAssignments)) {
            for (const uid of cardUids) {
              const entry = releaseIndex.get(uid);
              if (entry) {
                entry.card.assignedProjectId = null;
              }
            }
          }
          const dataset = draft.datasets.find((d) => d.id === project.datasetId);
          if (dataset) {
            const scoreParams = deriveBaseScoreParams(techEffects);
            const baseScore = calcBaseScore(
              project.paramCount * 1e9,
              dataset.effectiveTokens * 1e9,
              scoreParams
            );
            const knownArchMatrix = {};
            for (const techId of project.techIds) {
              const aggregated = aggregateExperiments(draft.experimentResults, techId);
              if (Object.keys(aggregated).length > 0) {
                knownArchMatrix[techId] = aggregated;
              }
            }
            const capResult = calculateCapabilities(
              baseScore,
              project.contextLength,
              dataset,
              knownArchMatrix,
              project.techIds,
              techEffects
            );
            const qualityFactor = 0.7 + 0.3 * project.stabilityScore;
            project.trainingLog.push({
              day: draft.date,
              event: `\u8BAD\u7EC3\u5B8C\u6210 \xB7 \u7A33\u5B9A\u5EA6 ${(project.stabilityScore * 100).toFixed(0)}% \xB7 \u8D28\u91CF\u7CFB\u6570 ${qualityFactor.toFixed(2)}`,
              severity: "info"
            });
            const model = {
              id: `${project.id}-model`,
              name: project.modelName,
              paramCount: project.paramCount,
              architecture: project.architecture,
              contextLength: project.contextLength,
              datasetId: project.datasetId,
              completedAt: draft.date,
              trainingProjectId: project.id,
              capabilities: Object.fromEntries(
                Object.entries(capResult.capabilities).map(([k, v]) => [k, v * qualityFactor])
              ),
              rawCapabilities: Object.fromEntries(
                Object.entries(capResult.rawCapabilities).map(([k, v]) => [k, v * qualityFactor])
              ),
              baseScore: baseScore * qualityFactor,
              daysSincePublished: 0,
              evaluationResearchers: 0,
              published: false,
              version: 1,
              audited: false,
              usedInResearch: false,
              noiseSeed: hashStr(`${project.id}-model` + draft.date + Math.random()),
              // PR-B v3：后训练状态初始为空
              postTraining: []
            };
            draft.models.push(model);
            const trainingResearcherIds = draft.employees.filter(
              (e) => e.role === "researcher" /* RESEARCHER */ && (e.status === "idle" || e.status === "assigned" && e.assignedProjectId === project.id)
            ).map((e) => e.id);
            accumulateResearcherContribution(draft, trainingResearcherIds, 5);
            releasedModels.push({ name: project.modelName, score: model.baseScore });
          }
        } else {
          const dailyResearcherIds = draft.employees.filter(
            (e) => e.role === "researcher" /* RESEARCHER */ && (e.status === "idle" || e.status === "assigned" && e.assignedProjectId === project.id)
          ).map((e) => e.id);
          accumulateResearcherContribution(draft, dailyResearcherIds, 1);
          progressInfo.push({
            id: project.id,
            modelName: project.modelName,
            effectiveTflops: result.effectiveTflops + cloudTFLOPS * 0.9,
            utilization: result.utilization,
            loss: project.currentLoss,
            valLoss: project.validationLoss,
            phase: project.trainingPhase,
            stability: project.stabilityScore
          });
        }
      }
    });
    for (const c of completed) {
      events.emit("TRAINING_COMPLETED", c.id, c.modelName);
    }
    for (const p of pausedProjects) {
      events.emit("TRAINING_PAUSED", p.id, p.reason);
    }
    for (const r of releasedModels) {
      events.emit("PLAYER_MODEL_RELEASED", r.name, r.score);
    }
    for (const p of autoResumedProjects) {
      events.emit("TRAINING_RESUMED", p.id);
    }
    for (const p of progressInfo) {
      events.emit("TRAINING_PROGRESS", p);
    }
    for (const e of events_log) {
      events.emit("TRAINING_EVENT", e);
    }
  }
  /** 从项目分配方案中收集卡规格 */
  collectCardSpecs(data, project) {
    const specs = [];
    const index = getCardIndex(data);
    for (const cardUids of Object.values(project.nodeAssignments)) {
      for (const uid of cardUids) {
        const entry = index.get(uid);
        if (entry && entry.card.status === "online") {
          const spec = getCardSpec(entry.modelId);
          if (spec) specs.push(spec);
        }
      }
    }
    return specs;
  }
};

// ../../src/core/systems/InfraMaintenanceSystem.ts
var InfraMaintenanceSystem = class {
  name = "InfraMaintenanceSystem";
  update(state, events, deltaDays) {
    const current2 = state.read();
    let totalNodeMaintenance = 0;
    for (const node of current2.serverNodes) {
      totalNodeMaintenance += node.maintenanceCost;
    }
    let totalClusterOps = 0;
    for (const cluster of current2.clusters) {
      totalClusterOps += cluster.operationalCostPerDay + cluster.storageCostPerDay;
    }
    let totalDcMaintenance = 0;
    let totalDcPowerCost = 0;
    const overloadDcs = [];
    const pueUpdatedDcs = [];
    for (const dc of current2.dataCenters) {
      totalDcMaintenance += dc.maintenanceCostPerDay;
      const daysSinceMaintenance = current2.date - dc.lastMaintenanceDay;
      let effectivePue = dc.currentPue;
      if (daysSinceMaintenance > 365) {
        const decay = 1 + (daysSinceMaintenance - 365) / 365 * 0.01;
        const degradedPue = Math.min(dc.basePue * decay, dc.basePue * 1.1);
        if (degradedPue > dc.currentPue) {
          effectivePue = degradedPue;
          pueUpdatedDcs.push({ id: dc.id, oldPue: dc.currentPue, newPue: effectivePue });
        }
      }
      const trainingCardSpecs = [];
      const idleCardSpecs = [];
      const cardIndex = getCardIndex(current2);
      for (const clusterId of dc.clusters) {
        const cluster = current2.clusters.find((c) => c.id === clusterId);
        if (!cluster) continue;
        const hasActiveTraining = current2.trainingProjects.some(
          (p) => p.clusterId === clusterId && p.status === "training"
        );
        const workload = hasActiveTraining ? "training" : "idle";
        for (const nodeId of cluster.nodes) {
          const node = current2.serverNodes.find((n) => n.id === nodeId);
          if (!node) continue;
          for (const cardUid of node.installedCards) {
            const entry = cardIndex.get(cardUid);
            if (entry && entry.card.status === "online") {
              const spec = getCardSpec(entry.modelId);
              if (spec) {
                if (workload === "training") {
                  trainingCardSpecs.push(spec);
                } else {
                  idleCardSpecs.push(spec);
                }
              }
            }
          }
        }
      }
      const trainingPowerKW = calcActualPowerDraw(trainingCardSpecs, "training");
      const idlePowerKW = calcActualPowerDraw(idleCardSpecs, "idle");
      const totalPowerKW = trainingPowerKW + idlePowerKW;
      const actualPowerMW = totalPowerKW / 1e3;
      const regionMods = getRegionModifiers(current2.headquartersRegionId);
      const powerReduction = getCompanyPowerReduction(current2);
      const coolingOverheadKW = totalPowerKW * (effectivePue - 1) * (1 - powerReduction);
      const dailyPowerCost = coolingOverheadKW * 24 * dc.powerCostPerKWh * regionMods.energyMultiplier * deltaDays;
      totalDcPowerCost += dailyPowerCost;
      if (actualPowerMW > dc.maxPowerMW) {
        overloadDcs.push(dc.id);
      }
    }
    const totalCost = (totalNodeMaintenance + totalClusterOps + totalDcMaintenance) * deltaDays + totalDcPowerCost;
    state.update((draft) => {
      if (totalCost > 0) {
        draft.resources["funds"] = Math.max(0, (draft.resources["funds"] ?? 0) - totalCost);
      }
      if (totalDcPowerCost > 0) {
        if (draft.lastDayPowerCostDate !== current2.date) {
          draft.lastDayPowerCostDate = current2.date;
          draft.lastDayPowerCost = 0;
        }
        draft.lastDayPowerCost += totalDcPowerCost;
      }
      for (const { id, newPue } of pueUpdatedDcs) {
        const d = draft.dataCenters.find((x) => x.id === id);
        if (d) d.currentPue = newPue;
      }
    });
    if (overloadDcs.length > 0) {
      state.update((draft) => {
        for (const dcId of overloadDcs) {
          const dc = draft.dataCenters.find((d) => d.id === dcId);
          if (!dc) continue;
          for (const clusterId of dc.clusters) {
            for (const project of draft.trainingProjects) {
              if (project.clusterId === clusterId && project.status === "training") {
                project.status = "paused";
                project.pauseReason = "\u7535\u529B\u8FC7\u8F7D";
              }
            }
          }
        }
      });
      for (const dcId of overloadDcs) {
        events.emit("POWER_OVERLOAD", dcId);
      }
    }
    events.emit("INFRA_MAINTENANCE", {
      nodeMaintenance: totalNodeMaintenance * deltaDays,
      clusterOps: totalClusterOps * deltaDays,
      dcMaintenance: totalDcMaintenance * deltaDays,
      dcPower: totalDcPowerCost,
      total: totalCost
    });
  }
};

// ../../src/core/systems/InfrastructureFailureSystem.ts
function applyCardFailure(draft, card, spec, modelId, failedCards, projectLostCards) {
  const isMajor = Math.random() < 0.5;
  card.status = isMajor ? "broken" : "offline";
  if (!isMajor) {
    card.autoRecoverDay = draft.date + 3 + Math.floor(Math.random() * 5);
  }
  failedCards.push({ uid: card.uid, modelId, severity: isMajor ? "major" : "minor" });
  if (card.assignedProjectId) {
    const project = draft.trainingProjects.find((p) => p.id === card.assignedProjectId);
    if (project) {
      for (const nodeId of Object.keys(project.nodeAssignments)) {
        project.nodeAssignments[nodeId] = project.nodeAssignments[nodeId].filter(
          (uid) => uid !== card.uid
        );
      }
      projectLostCards.set(project.id, (projectLostCards.get(project.id) ?? 0) + 1);
    }
    card.assignedProjectId = null;
  }
  const cardName = spec.name ?? modelId;
  const severity = isMajor ? "critical" : "warning";
  const recoverMsg = isMajor ? "\uFF08\u9700\u62A5\u5E9F\uFF09" : `\uFF08${card.autoRecoverDay - draft.date} \u5929\u540E\u81EA\u52A8\u4FEE\u590D\uFF09`;
  draft.infraEventLog.push({
    date: draft.date,
    type: "CARD_FAILED",
    message: `${cardName} (${card.uid.slice(-6)}) \u53D1\u751F${isMajor ? "\u4E25\u91CD\u6545\u969C" : "\u8F7B\u5FAE\u6545\u969C"}${recoverMsg}`,
    severity
  });
}
var InfrastructureFailureSystem = class {
  name = "InfrastructureFailureSystem";
  update(state, events, deltaDays) {
    const failedCards = [];
    const recoveredCards = [];
    const failedNodes = [];
    const networkGlitches = [];
    const pausedProjects = [];
    state.update((draft) => {
      for (const cluster of draft.clusters) {
        if (cluster.utilizationBonus === 0 && cluster.baseUtilizationBonus > 0) {
          cluster.utilizationBonus = cluster.baseUtilizationBonus;
        }
      }
      for (const modelId of Object.keys(draft.resourceMeta)) {
        const pool = draft.resourceMeta[modelId];
        if (!Array.isArray(pool)) continue;
        for (const card of pool) {
          if (card.status === "offline" && card.autoRecoverDay !== void 0 && draft.date >= card.autoRecoverDay) {
            card.status = "online";
            card.autoRecoverDay = void 0;
            recoveredCards.push({ uid: card.uid, modelId });
            const spec = getCardSpec(modelId);
            const repairCost = spec ? spec.unitCost * 5e-3 : 100;
            draft.resources["funds"] = (draft.resources["funds"] ?? 0) - repairCost;
            draft.infraEventLog.push({
              date: draft.date,
              type: "CARD_RECOVERED",
              message: `${spec?.name ?? modelId} (${card.uid.slice(-6)}) \u81EA\u52A8\u4FEE\u590D\u5B8C\u6210\uFF0C\u6263 $${repairCost.toLocaleString()}`,
              severity: "info"
            });
          }
        }
      }
      this.applyHostSpares(draft, draft.date);
      for (const node of draft.serverNodes) {
        const daysSinceMaintenance = draft.date - node.lastMaintenanceDay;
        const agingSteps = Math.floor(daysSinceMaintenance / 30);
        const expectedReliability = Math.max(50, node.baseReliability - agingSteps);
        if (node.reliability > expectedReliability) {
          node.reliability = expectedReliability;
        }
      }
      const staffFailureMult = getStaffInfraFailureReduction(draft);
      const projectLostCards = /* @__PURE__ */ new Map();
      const projectTotalAssigned = /* @__PURE__ */ new Map();
      for (const project of draft.trainingProjects) {
        if (project.status !== "training") continue;
        let total = 0;
        for (const nodeId of Object.keys(project.nodeAssignments)) {
          total += project.nodeAssignments[nodeId].length;
        }
        projectTotalAssigned.set(project.id, total);
      }
      for (const modelId of Object.keys(draft.resourceMeta)) {
        const pool = draft.resourceMeta[modelId];
        if (!Array.isArray(pool)) continue;
        const onlineCards = [];
        for (const card of pool) {
          if (card.status === "online") {
            card.age += deltaDays;
            onlineCards.push(card);
          }
        }
        const spec = getCardSpec(modelId);
        if (!spec || onlineCards.length === 0) continue;
        const USE_SAMPLE_THRESHOLD = 2048;
        const useSampling = onlineCards.length > USE_SAMPLE_THRESHOLD;
        if (useSampling) {
          const assignedCards = [];
          const idleCards = [];
          for (const c of onlineCards) {
            if (c.assignedProjectId) assignedCards.push(c);
            else idleCards.push(c);
          }
          if (idleCards.length > 0) {
            const idleFailProb = spec.wearPerDay * (1 + 0.3) * 0.3 * staffFailureMult * deltaDays;
            const expectedFails = idleCards.length * idleFailProb;
            const failCount = Math.floor(expectedFails) + (Math.random() < expectedFails % 1 ? 1 : 0);
            for (let i = 0; i < failCount && idleCards.length > 0; i++) {
              const idx = Math.floor(Math.random() * idleCards.length);
              const card = idleCards.splice(idx, 1)[0];
              applyCardFailure(draft, card, spec, modelId, failedCards, projectLostCards);
            }
          }
          const projectGroups = /* @__PURE__ */ new Map();
          for (const c of assignedCards) {
            const pid = c.assignedProjectId;
            if (!projectGroups.has(pid)) projectGroups.set(pid, []);
            projectGroups.get(pid).push(c);
          }
          for (const [pid, cards] of projectGroups) {
            const project = draft.trainingProjects.find((p) => p.id === pid);
            const avgAge = cards.reduce((s, c) => s + c.age, 0) / cards.length;
            let dailyFailProb = spec.wearPerDay * (1 + avgAge / 1e3) * 1 * staffFailureMult;
            if (project) {
              const pc = project.parallelConfig;
              let parallelRiskMultiplier = 1;
              let maxMaturity = 0;
              const addRisk = (techId, baseRisk, safeDegree, deg) => {
                const mat = draft.techMaturity[techId] ?? 0;
                if (mat >= 1 && deg > 1) {
                  const risk = baseRisk * (1 - mat / 100) * (deg / safeDegree);
                  parallelRiskMultiplier += risk;
                  maxMaturity = Math.max(maxMaturity, mat);
                }
              };
              addRisk("pipeline_parallel", 0.15, 4, pc.ppStages ?? 1);
              addRisk("tensor_parallel", 0.25, 4, pc.tpSize ?? 1);
              addRisk("expert_parallel", 0.1, 8, pc.epGroups ?? 1);
              addRisk("context_parallel", 0.12, 4, pc.cpSize ?? 1);
              const reliabilityBonus = Math.min(0.8, maxMaturity / 100 * 0.8);
              dailyFailProb *= parallelRiskMultiplier * (1 - reliabilityBonus);
            }
            const failProb = dailyFailProb * deltaDays;
            const expectedFails = cards.length * failProb;
            const failCount = Math.floor(expectedFails) + (Math.random() < expectedFails % 1 ? 1 : 0);
            for (let i = 0; i < failCount && cards.length > 0; i++) {
              const idx = Math.floor(Math.random() * cards.length);
              const card = cards.splice(idx, 1)[0];
              applyCardFailure(draft, card, spec, modelId, failedCards, projectLostCards);
            }
          }
        } else {
          for (const card of onlineCards) {
            const loadFactor = card.assignedProjectId ? 1 : 0.3;
            let dailyFailProb = spec.wearPerDay * (1 + card.age / 1e3) * loadFactor * staffFailureMult;
            if (card.assignedProjectId) {
              const project = draft.trainingProjects.find((p) => p.id === card.assignedProjectId);
              if (project) {
                const pc = project.parallelConfig;
                let parallelRiskMultiplier = 1;
                let maxMaturity = 0;
                const addRisk = (techId, baseRisk, safeDegree, deg) => {
                  const mat = draft.techMaturity[techId] ?? 0;
                  if (mat >= 1 && deg > 1) {
                    const risk = baseRisk * (1 - mat / 100) * (deg / safeDegree);
                    parallelRiskMultiplier += risk;
                    maxMaturity = Math.max(maxMaturity, mat);
                  }
                };
                addRisk("pipeline_parallel", 0.15, 4, pc.ppStages ?? 1);
                addRisk("tensor_parallel", 0.25, 4, pc.tpSize ?? 1);
                addRisk("expert_parallel", 0.1, 8, pc.epGroups ?? 1);
                addRisk("context_parallel", 0.12, 4, pc.cpSize ?? 1);
                const reliabilityBonus = Math.min(0.8, maxMaturity / 100 * 0.8);
                dailyFailProb *= parallelRiskMultiplier * (1 - reliabilityBonus);
              }
            }
            if (Math.random() < dailyFailProb * deltaDays) {
              applyCardFailure(draft, card, spec, modelId, failedCards, projectLostCards);
            }
          }
        }
      }
      const totalNodes = draft.serverNodes.length;
      const nodeCountFactor = 1 + Math.log(totalNodes + 1) / 10;
      for (const node of draft.serverNodes) {
        const dailyNodeFailProb = (100 - node.reliability) / 1e4 * nodeCountFactor;
        if (Math.random() < dailyNodeFailProb * deltaDays) {
          let offlineCount = 0;
          const nodeFailIndex = getCardIndex(draft);
          for (const cardUid of node.installedCards) {
            const entry = nodeFailIndex.get(cardUid);
            if (entry && entry.card.status === "online") {
              const card = entry.card;
              card.status = "offline";
              card.autoRecoverDay = draft.date + 5 + Math.floor(Math.random() * 4);
              offlineCount++;
              if (card.assignedProjectId) {
                const project = draft.trainingProjects.find((p) => p.id === card.assignedProjectId);
                if (project) {
                  for (const nid of Object.keys(project.nodeAssignments)) {
                    project.nodeAssignments[nid] = project.nodeAssignments[nid].filter(
                      (uid) => uid !== card.uid
                    );
                  }
                  projectLostCards.set(project.id, (projectLostCards.get(project.id) ?? 0) + 1);
                }
                card.assignedProjectId = null;
              }
            }
          }
          failedNodes.push({ id: node.id, name: node.name, cardCount: offlineCount });
          const cluster = draft.clusters.find((c) => c.nodes.includes(node.id));
          if (cluster && cluster.nodes.length > 1) {
            const failedInCluster = failedNodes.filter(
              (fn) => cluster.nodes.includes(fn.id) && fn.id !== node.id
            ).length + 1;
            if (failedInCluster > cluster.nodes.length * 0.5) {
              for (const project of draft.trainingProjects) {
                if (project.clusterId === cluster.id && project.status === "training") {
                  project.status = "paused";
                  project.pauseReason = `\u96C6\u7FA4 ${cluster.name} \u8D85\u8FC7\u534A\u6570\u8282\u70B9\u6545\u969C`;
                  project.computeRemaining = project.lastCheckpointRemaining;
                  pausedProjects.push(project.id);
                }
              }
            }
          }
          const recoverMin = 5;
          const recoverMax = 9;
          draft.infraEventLog.push({
            date: draft.date,
            type: "NODE_FAILED",
            message: `\u8282\u70B9 ${node.name} \u6545\u969C\uFF0C${offlineCount} \u5361\u79BB\u7EBF\uFF08${recoverMin}-${recoverMax} \u5929\u540E\u81EA\u52A8\u6062\u590D\uFF09`,
            severity: "critical"
          });
        }
      }
      for (const [projectId, lostCount] of projectLostCards) {
        const total = projectTotalAssigned.get(projectId) ?? 1;
        if (total > 0 && lostCount / total > 0.3) {
          const project = draft.trainingProjects.find((p) => p.id === projectId);
          if (project && project.status === "training") {
            project.status = "paused";
            project.pauseReason = `\u540C\u65E5 ${lostCount}/${total} \u5361\u6545\u969C\uFF08\u8D85\u8FC7 30%\uFF09\uFF0C\u8BAD\u7EC3\u6682\u505C`;
            const lostProgress = project.lastCheckpointRemaining - project.computeRemaining;
            if (lostProgress > 0) {
              project.lostFlops += lostProgress;
              project.computeRemaining = project.lastCheckpointRemaining;
            }
            pausedProjects.push(projectId);
          }
        }
      }
      for (const cluster of draft.clusters) {
        const dailyNetworkProb = 0.03 / 365 * cluster.nodes.length;
        if (Math.random() < dailyNetworkProb * deltaDays) {
          cluster.utilizationBonus = 0;
          networkGlitches.push({ clusterId: cluster.id, clusterName: cluster.name });
          draft.infraEventLog.push({
            date: draft.date,
            type: "NETWORK_GLITCH",
            message: `\u96C6\u7FA4 ${cluster.name} \u7F51\u7EDC\u6545\u969C\uFF0C\u5F53\u65E5\u5229\u7528\u7387\u52A0\u6210\u6E05\u96F6`,
            severity: "warning"
          });
        }
      }
      if (draft.infraEventLog.length > 100) {
        draft.infraEventLog = draft.infraEventLog.slice(-100);
      }
    });
    for (const c of failedCards) {
      events.emit("CARD_FAILED", c.uid, c.modelId, c.severity);
    }
    for (const r of recoveredCards) {
      events.emit("CARD_RECOVERED", r.uid, r.modelId);
    }
    for (const n of failedNodes) {
      events.emit("NODE_FAILED", n.id, n.name);
    }
    for (const g of networkGlitches) {
      events.emit("NETWORK_GLITCH", g.clusterId, g.clusterName);
    }
    for (const pid of pausedProjects) {
      events.emit("TRAINING_PAUSED", pid);
    }
  }
  /**
   * ★ R4: 数据中心热备池自动替换 broken/offline 卡
   *
   * 条件：数据中心安装 ≥ 50 卡时启用。
   * 行为：每日检查是否有 broken 的卡，自动从仓库未安装卡中替换。
   *       替换后旧卡报废移除。无库存时 skip。
   *       热备池容量 = 已安装卡数的 2%，min 1 张。
   */
  applyHostSpares(draft, today) {
    for (const dc of draft.dataCenters) {
      let installedTotal = 0;
      for (const clusterId of dc.clusters) {
        const cluster = draft.clusters.find((c) => c.id === clusterId);
        if (!cluster) continue;
        for (const nodeId of cluster.nodes) {
          const node = draft.serverNodes.find((n) => n.id === nodeId);
          if (node) installedTotal += node.installedCards.length;
        }
      }
      if (installedTotal < 50) continue;
      const spareCapacity = Math.max(1, Math.floor(installedTotal * 0.02));
      const brokenCards = [];
      const breakIndex = getCardIndex(draft);
      for (const clusterId of dc.clusters) {
        const cluster = draft.clusters.find((c) => c.id === clusterId);
        if (!cluster) continue;
        for (const nodeId of cluster.nodes) {
          const node = draft.serverNodes.find((n) => n.id === nodeId);
          if (!node) continue;
          for (const cardUid of node.installedCards) {
            const entry = breakIndex.get(cardUid);
            if (entry && entry.card.status === "broken") {
              brokenCards.push({ uid: entry.card.uid, modelId: entry.modelId, nodeId, location: entry.card.location ?? "unknown" });
            }
          }
        }
      }
      if (brokenCards.length === 0) continue;
      const spareCards = [];
      for (const modelId of Object.keys(draft.resourceMeta)) {
        const pool = draft.resourceMeta[modelId];
        if (!pool || !Array.isArray(pool)) continue;
        for (const card of pool) {
          if (card.location === null && card.status === "online" && card.assignedProjectId === null) {
            spareCards.push({ uid: card.uid, modelId });
          }
        }
      }
      if (spareCards.length === 0) continue;
      let replaced = 0;
      for (const broken of brokenCards) {
        if (replaced >= spareCapacity || spareCards.length === 0) break;
        const spareIdx = spareCards.findIndex((s) => s.modelId === broken.modelId);
        if (spareIdx < 0) continue;
        const spare = spareCards.splice(spareIdx, 1)[0];
        replaced++;
        const oldPool = draft.resourceMeta[broken.modelId];
        if (!Array.isArray(oldPool)) continue;
        const oldIdx = oldPool.findIndex((c) => c.uid === broken.uid);
        if (oldIdx >= 0) oldPool.splice(oldIdx, 1);
        const node = draft.serverNodes.find((n) => n.id === broken.nodeId);
        if (node) {
          const cardIdx = node.installedCards.indexOf(broken.uid);
          if (cardIdx >= 0) {
            node.installedCards[cardIdx] = spare.uid;
          }
        }
        const newPool = draft.resourceMeta[spare.modelId];
        if (!Array.isArray(newPool)) continue;
        const newCard = newPool.find((c) => c.uid === spare.uid);
        if (newCard) {
          newCard.location = broken.location;
          newCard.assignedProjectId = null;
        }
        draft.infraEventLog.push({
          date: today,
          type: "CARD_RECOVERED",
          message: `${getCardSpec(broken.modelId)?.name ?? broken.modelId} \u70ED\u5907\u66FF\u6362 (${broken.uid.slice(-6)} \u2192 ${spare.uid.slice(-6)})`,
          severity: "info"
        });
      }
    }
  }
};

// ../../src/core/utils/techLookup.ts
function isTechUnlocked(data, techId) {
  return (data.techMaturity[techId] ?? 0) >= 1;
}
function getUnlockedTechIds(data) {
  return Object.keys(data.techMaturity).filter((id) => (data.techMaturity[id] ?? 0) >= 1);
}

// ../../src/core/systems/IdeaGenerationSystem.ts
var IDEA_TICK_DAYS = 7;
var MAX_PENDING_IDEAS = 50;
function genId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
var IdeaGenerationSystem = class {
  name = "IdeaGenerationSystem";
  update(state, events, _deltaDays) {
    const current2 = state.read();
    if (current2.date % IDEA_TICK_DAYS !== 0) return;
    const newIdeas = [];
    const researchers = current2.employees.filter(
      (e) => e.role === "researcher" /* RESEARCHER */ && e.status !== "training"
    );
    for (const r of researchers) {
      const eff = calcEmployeeEfficiency(r, current2.departments, current2.employees);
      const existingIdea = current2.pendingIdeas.find(
        (i) => i.sourceEmployeeId === r.id && i.status !== "rejected" && i.status !== "failed"
      );
      if (existingIdea) continue;
      const baseP = Math.max(0, Math.min(
        0.6,
        0.05 + (r.attributes.intelligence - 50) * 3e-3 + (r.attributes.creativity - 50) * 4e-3 + r.level * 0.01
      ));
      const unlockedCount = Object.values(current2.techMaturity).filter((m) => m >= 1).length;
      const difficultyMult = Math.max(0.15, 1 - unlockedCount * 0.025 - current2.date * 3e-4);
      const p = baseP * eff * difficultyMult;
      if (Math.random() >= p) continue;
      const isUnique = Math.random() < 0.2;
      const idea = this.generateIdea(current2, r, isUnique);
      if (idea) {
        newIdeas.push(idea);
        events.emit("IDEA_GENERATED", idea);
      }
    }
    if (newIdeas.length === 0) return;
    state.update((draft) => {
      draft.pendingIdeas.push(...newIdeas);
      if (draft.pendingIdeas.length > MAX_PENDING_IDEAS) {
        const active = draft.pendingIdeas.filter((i) => i.status !== "pending");
        const pendingOnly = draft.pendingIdeas.filter((i) => i.status === "pending").slice(-MAX_PENDING_IDEAS);
        draft.pendingIdeas = [...pendingOnly, ...active];
      }
    });
  }
  /**
   * 生成一条 idea
   *
   * @param data        当前游戏状态（只读快照）
   * @param researcher  产出 idea 的研究员
   * @param isUnique    true=独有技术；false=加速现有技术
   * @returns TechIdea 或 null（候选池为空时）
   */
  generateIdea(data, researcher, isUnique) {
    const day = data.date;
    const empName = researcher.name;
    if (isUnique) {
      const available = IDEA_TECH_POOL.filter((t) => !IDEA_TECH_MAP[t.id]);
      if (available.length === 0) return null;
      const picked2 = available[Math.floor(Math.random() * available.length)];
      return {
        id: genId(`idea-${day}-${researcher.id}`),
        sourceEmployeeId: researcher.id,
        generatedDay: day,
        kind: "unique",
        targetTechId: picked2.id,
        value: 5,
        title: `${empName} \u63D0\u51FA\u72EC\u6709\u6280\u672F\u65B9\u6848`,
        description: `${picked2.name}\uFF1A${picked2.description}\uFF08\u521D\u59CB\u6210\u719F\u5EA6 5\uFF0C\u9700\u5B9E\u9A8C\u63D0\u5347\uFF09`,
        status: "pending"
      };
    }
    const candidates = [];
    const unlockedNotMax = getUnlockedTechIds(data).filter(
      (id) => (data.techMaturity[id] ?? 0) < 100
    );
    for (const techId of unlockedNotMax) {
      candidates.push({ techId });
    }
    if (candidates.length === 0) return null;
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    const techNode = TECH_MAP[picked.techId] ?? IDEA_TECH_MAP[picked.techId];
    const techName = techNode?.name ?? picked.techId;
    const gain = 5 + researcher.attributes.creativity / 100 * 5;
    const currentMaturity = data.techMaturity[picked.techId] ?? 0;
    return {
      id: genId(`idea-${day}-${researcher.id}`),
      sourceEmployeeId: researcher.id,
      generatedDay: day,
      kind: "accelerate",
      targetTechId: picked.techId,
      value: gain,
      title: `${empName} \u4F18\u5316\u4E86 ${techName}`,
      description: `\u6210\u719F\u5EA6 +${gain.toFixed(1)}\uFF08\u5F53\u524D ${currentMaturity.toFixed(0)} \u2192 ${Math.min(100, currentMaturity + gain).toFixed(0)}\uFF09`,
      status: "pending"
    };
  }
};

// ../../src/core/systems/TechResearchSystem.ts
var TechResearchSystem = class {
  name = "TechResearchSystem";
  update(state, events, deltaDays) {
    this.processIdeaVerification(state, events, deltaDays);
  }
  /**
   * 每日推进 idea 验证进度
   *
   * 对 status='verifying' 的 idea：
   * 1. 扣除每日验证成本（资金不足则暂停，不清空进度）
   * 2. 递增 verificationDays
   * 3. 到达 totalDays 时：按 successProbability 掷骰
   *    - 成功 → status='accepted'，应用完整效果
   *    - 失败 → status='failed'，应用 25% 效果
   */
  processIdeaVerification(state, events, deltaDays) {
    const current2 = state.read();
    const verifying = current2.pendingIdeas.filter((i) => i.status === "verifying");
    if (verifying.length === 0) return;
    let remainingFunds = current2.resources["funds"] ?? 0;
    const dayResults = [];
    for (const idea of verifying) {
      const dailyCost = idea.verificationDailyCost ?? 0;
      const totalCost = dailyCost * deltaDays;
      const canAfford = remainingFunds >= totalCost;
      const newDays = canAfford ? (idea.verificationDays ?? 0) + deltaDays : idea.verificationDays ?? 0;
      const willComplete = canAfford && newDays >= (idea.verificationTotalDays ?? 1);
      if (!canAfford) {
        events.emit("IDEA_VERIFICATION_PAUSED", {
          ideaId: idea.id,
          title: idea.title,
          deficit: totalCost - remainingFunds
        });
      } else {
        remainingFunds -= totalCost;
      }
      dayResults.push({ idea, newDays, willComplete, totalCost, canAfford });
    }
    const completedResults = [];
    for (const dr of dayResults) {
      if (dr.willComplete) {
        const success = Math.random() < (dr.idea.successProbability ?? 0.5);
        completedResults.push({ idea: dr.idea, success });
      }
    }
    if (dayResults.length === 0) return;
    state.update((draft) => {
      for (const dr of dayResults) {
        if (dr.canAfford && dr.totalCost > 0) {
          draft.resources["funds"] = Math.max(0, (draft.resources["funds"] ?? 0) - dr.totalCost);
        }
        const target = draft.pendingIdeas.find((i) => i.id === dr.idea.id);
        if (!target) continue;
        target.verificationDays = dr.newDays;
        if (dr.willComplete) {
          const result = completedResults.find((r) => r.idea.id === dr.idea.id);
          if (!result) continue;
          if (result.success) {
            target.status = "accepted";
            this.applyIdeaEffect(draft, dr.idea, 1);
          } else {
            target.status = "failed";
            this.applyIdeaEffect(draft, dr.idea, 0.25);
          }
        }
      }
    });
    for (const { idea, success } of completedResults) {
      if (success) {
        events.emit("IDEA_VERIFIED", {
          ideaId: idea.id,
          title: idea.title,
          targetTechId: idea.targetTechId,
          kind: idea.kind
        });
      } else {
        events.emit("IDEA_VERIFICATION_FAILED", {
          ideaId: idea.id,
          title: idea.title,
          reason: "\u9A8C\u8BC1\u5931\u8D25\uFF0C\u6548\u679C\u964D\u4F4E\u81F3 25%",
          sourceEmployeeId: idea.sourceEmployeeId
        });
      }
    }
  }
  /**
   * 应用 idea 效果（抽取为公共方法，供成功/失败复用）
   *
   * PR-C 变更：accelerate 分支不再判断 researchingTech（研发中技术概念已删除），
   *           统一作用于"已解锁但未满级"的技术，提升其 maturity。
   *
   * @param draft     immer draft
   * @param idea      idea 数据
   * @param ratio     效果比例：1.0=完整，0.25=失败保留
   */
  applyIdeaEffect(draft, idea, ratio) {
    const effectiveValue = idea.value * ratio;
    if (idea.kind === "accelerate") {
      const existing = draft.techMaturity[idea.targetTechId] ?? 0;
      draft.techMaturity[idea.targetTechId] = Math.min(100, existing + effectiveValue);
    } else {
      const poolNode = IDEA_TECH_POOL.find((t) => t.id === idea.targetTechId);
      if (poolNode && !IDEA_TECH_MAP[poolNode.id]) {
        IDEA_TECH_MAP[poolNode.id] = poolNode;
        draft.acceptedIdeaTechs.push(poolNode);
      }
      const existing = draft.techMaturity[idea.targetTechId] ?? 0;
      draft.techMaturity[idea.targetTechId] = Math.max(existing, effectiveValue);
    }
  }
};

// ../../src/core/config/archEffects.ts
function mulberry32(seed) {
  let a = seed;
  return function() {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function generateArchMatrix(seed) {
  const rng = mulberry32(seed);
  const matrix = {};
  matrix["rope"] = {
    long_range_coherence: 0.2 + rng() * 0.1,
    metacognition: 0.1 + rng() * 0.05
  };
  matrix["moe"] = {
    world_knowledge: 0.15 + rng() * 0.1,
    multilingual: 0.1 + rng() * 0.08
  };
  matrix["swiglu"] = {
    dialogue_fluency: 0.03 + rng() * 0.02,
    creative_writing: 0.02 + rng() * 0.02
  };
  return matrix;
}

// ../../src/core/systems/ResearchSystem.ts
function genId2(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
var ResearchSystem = class {
  name = "ResearchSystem";
  update(state, events, deltaDays) {
    const current2 = state.read();
    const researchSpeedBonus = aggregateMultiplicative(
      getActiveTechEffects(current2),
      "improve_research_speed",
      TECH_EFFECT_CAPS.improve_research_speed
    );
    const clusterTotalTflops = calcClusterTotalTflops(current2);
    const completedExperiments = [];
    state.update((draft) => {
      for (const project of draft.researchProjects) {
        if (project.status !== "in_progress") continue;
        if (project.type !== "experiment_validation") continue;
        if (project.experimentParams !== null && project.computeRatio !== null) {
          const dailyCompute = clusterTotalTflops * project.computeRatio * deltaDays;
          const effectiveDailyCompute = dailyCompute * (1 + researchSpeedBonus);
          const staffSpeedMult2 = getStaffResearchSpeedMultiplier(draft);
          const computeGain = effectiveDailyCompute * staffSpeedMult2;
          const budget = project.computeBudgetTotal ?? project.computeBudget;
          project.computeUsed += computeGain;
          project.progress = Math.min(1, project.computeUsed / Math.max(1, budget));
          accumulateResearcherContribution(draft, project.researcherIds, computeGain / Math.max(1, budget));
          if (project.progress >= 1) {
            project.progress = 1;
            project.computeUsed = budget;
            project.status = "completed";
            project.completedAt = draft.date;
            const archMatrix = generateArchMatrix(draft.archMatrixSeed);
            const archMaturity = draft.techMaturity[project.targetArchId ?? ""] ?? 0;
            const paramsBasedSigma = EXPERIMENT_CONFIG.baseNoiseSigma * (1 - Math.min(0.5, Math.log2(Math.max(1, project.experimentParams)) / 10));
            const result = runExperimentWithNoise(
              project.targetArchId ?? "",
              archMatrix,
              paramsBasedSigma,
              project.experimentParams,
              0,
              archMaturity
            );
            result.date = draft.date;
            project.experimentResult = result;
            draft.experimentResults.push(result);
            const techId = project.targetArchId ?? "";
            let shouldAutoRestart = false;
            if (techId) {
              const techNode = TECH_MAP[techId] ?? IDEA_TECH_MAP[techId];
              const difficulty = techNode?.difficulty ?? 1;
              const existingMaturity = draft.techMaturity[techId] ?? 0;
              const maxCap = calcMaxMaturityCap(project.experimentParams, difficulty);
              let sumIntelligence = 0;
              const empMap = /* @__PURE__ */ new Map();
              for (const e of draft.employees) empMap.set(e.id, e);
              for (const rid of project.researcherIds) {
                const r = empMap.get(rid);
                if (!r || r.status === "training") continue;
                const eff = calcEmployeeEfficiency(r, draft.departments, draft.employees);
                sumIntelligence += eff * r.attributes.intelligence;
              }
              const gain = calcMaturityGain(
                project.experimentParams,
                project.computeRatio,
                existingMaturity,
                sumIntelligence,
                difficulty
              );
              draft.techMaturity[techId] = Math.min(maxCap, existingMaturity + gain);
              if (project.repeatMode === "to_cap" && draft.techMaturity[techId] < maxCap) {
                const restartFundsCost = calcExperimentFundsCost(project.experimentParams);
                const currentFunds = draft.resources["funds"] ?? 0;
                if (currentFunds >= restartFundsCost) {
                  shouldAutoRestart = true;
                  draft.resources["funds"] = Math.max(0, currentFunds - restartFundsCost);
                  project.status = "in_progress";
                  project.progress = 0;
                  project.computeUsed = 0;
                  project.completedAt = null;
                  project.experimentResult = null;
                  project.startedAt = draft.date;
                }
              }
            }
            if (!shouldAutoRestart) {
              for (const empId of project.researcherIds) {
                const emp = draft.employees.find((e) => e.id === empId);
                if (emp) {
                  emp.status = "idle";
                  emp.assignedProjectId = void 0;
                }
              }
            }
            if (!shouldAutoRestart) {
              completedExperiments.push({ archId: project.targetArchId, result });
            }
          }
          continue;
        }
        const baseProgress = project.experimentScale === "small" ? EXPERIMENT_VALIDATION.smallDailyProgress : EXPERIMENT_VALIDATION.mediumDailyProgress;
        const dailyProgress = baseProgress * (1 + researchSpeedBonus);
        const staffSpeedMult = getStaffResearchSpeedMultiplier(draft);
        project.progress += dailyProgress * deltaDays * staffSpeedMult;
        project.computeUsed = project.computeBudget * project.progress;
        accumulateResearcherContribution(draft, project.researcherIds, dailyProgress);
        if (project.progress >= 1) {
          project.progress = 1;
          project.computeUsed = project.computeBudget;
          project.status = "completed";
          project.completedAt = draft.date;
          const archMatrix = generateArchMatrix(draft.archMatrixSeed);
          const archMaturity = draft.techMaturity[project.targetArchId ?? ""] ?? 0;
          const result = runExperiment(
            project.targetArchId ?? "",
            archMatrix,
            project.experimentScale ?? "small",
            0,
            archMaturity
          );
          result.date = draft.date;
          project.experimentResult = result;
          draft.experimentResults.push(result);
          const archTechId = project.targetArchId ?? "";
          if (archTechId) {
            const gain = project.experimentScale === "medium" ? 12 : 5;
            const existing = draft.techMaturity[archTechId] ?? 0;
            draft.techMaturity[archTechId] = Math.min(100, existing + gain);
          }
          for (const empId of project.researcherIds) {
            const emp = draft.employees.find((e) => e.id === empId);
            if (emp) {
              emp.status = "idle";
              emp.assignedProjectId = void 0;
            }
          }
          completedExperiments.push({ archId: project.targetArchId, result });
        }
      }
      if (draft.riskState.trustDebt > 0) {
        draft.riskState.trustDebt = Math.max(0, draft.riskState.trustDebt - 0.05 * deltaDays);
      }
      while (true) {
        const activeCount = draft.researchProjects.filter(
          (p) => p.status === "in_progress"
        ).length;
        if (activeCount >= RESEARCH_CONFIG.maxConcurrentProjects) break;
        if (draft.experimentQueue.length === 0) break;
        const queueItem = draft.experimentQueue[0];
        const availableResearchers = queueItem.researcherIds.filter((rid) => {
          const emp = draft.employees.find((e) => e.id === rid);
          return emp && emp.role === "researcher" /* RESEARCHER */ && emp.status !== "assigned";
        });
        const researchersToUse = queueItem.researcherIds.length > 0 ? availableResearchers : draft.employees.filter((e) => e.role === "researcher" /* RESEARCHER */ && e.status === "idle").map((e) => e.id);
        if (researchersToUse.length === 0) {
          break;
        }
        const fundsCost = calcExperimentFundsCost(queueItem.experimentParams);
        const currentFunds = draft.resources["funds"] ?? 0;
        if (currentFunds < fundsCost) {
          break;
        }
        const currentTotalRatio = draft.researchProjects.filter((p) => p.status === "in_progress" && p.computeRatio !== null).reduce((s, p) => s + (p.computeRatio ?? 0), 0);
        if (currentTotalRatio + queueItem.computeRatio > 0.95) {
          break;
        }
        const computeBudgetTotal = calcExperimentBudget(queueItem.experimentParams);
        draft.resources["funds"] = Math.max(0, currentFunds - fundsCost);
        const projectId = genId2("research");
        draft.researchProjects.push({
          id: projectId,
          type: "experiment_validation",
          status: "in_progress",
          targetArchId: queueItem.techId,
          researcherIds: [...researchersToUse],
          computeBudget: computeBudgetTotal,
          computeUsed: 0,
          progress: 0,
          startedAt: draft.date,
          completedAt: null,
          experimentResult: null,
          experimentScale: null,
          experimentParams: queueItem.experimentParams,
          computeRatio: queueItem.computeRatio,
          computeBudgetTotal,
          repeatMode: queueItem.repeatMode,
          queueItemId: queueItem.id
        });
        for (const empId of researchersToUse) {
          const emp = draft.employees.find((e) => e.id === empId);
          if (emp) {
            emp.status = "assigned";
            emp.assignedProjectId = projectId;
          }
        }
        draft.experimentQueue.shift();
      }
    });
    for (const { archId, result } of completedExperiments) {
      events.emit("EXPERIMENT_COMPLETED", { archId, result });
    }
  }
};
function runExperimentWithNoise(archTechId, archMatrix, noiseSigma, _params, confidenceBonus, techMaturity) {
  const trueBonuses = archMatrix[archTechId] ?? {};
  const modelScale = Math.min(1, _params / 64);
  const estimatedBonuses = {};
  for (const capId of Object.keys(trueBonuses)) {
    const trueValue = trueBonuses[capId] ?? 0;
    const u1 = Math.max(1e-10, Math.random());
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    estimatedBonuses[capId] = trueValue + z * noiseSigma;
  }
  let matConfBonus = 0;
  if (techMaturity >= 100) matConfBonus = 0.2;
  else if (techMaturity >= 50) matConfBonus = 0.1;
  return {
    archTechId,
    estimatedBonuses,
    confidence: Math.max(0.1, Math.min(1, 1 - noiseSigma + confidenceBonus + matConfBonus)),
    modelScale,
    date: 0
  };
}

// ../../src/core/config/riskEvents.ts
var RISK_EVENTS = [
  {
    id: "training_crash",
    name: "\u8BAD\u7EC3\u5D29\u6E83",
    description: "\u6FC0\u8FDB\u914D\u7F6E\u5BFC\u81F4\u8BAD\u7EC3\u5931\u8D25",
    trigger: { baseProbability: 1e-3 },
    effects: { fundsLoss: 5e4, moraleLoss: 5, trainingPauseDays: 3 },
    severity: "major"
  },
  {
    id: "lawsuit_filed",
    name: "\u96C6\u4F53\u8BC9\u8BBC",
    description: "\u56E0\u6570\u636E\u4F7F\u7528\u95EE\u9898\u88AB\u8D77\u8BC9",
    trigger: { legalDebt: 5, baseProbability: 1e-3, riskFactor: 5e-4 },
    effects: { fundsLoss: 5e5, reputationLoss: 10, legalDebtReduction: 2 },
    severity: "major"
  },
  {
    id: "regulatory_investigation",
    name: "\u76D1\u7BA1\u8C03\u67E5",
    description: "\u76D1\u7BA1\u673A\u6784\u4ECB\u5165\u8C03\u67E5",
    trigger: { legalDebt: 10, baseProbability: 5e-4, riskFactor: 8e-4 },
    effects: { fundsLoss: 1e6, reputationLoss: 20, trainingPauseDays: 7, legalDebtReduction: 3 },
    severity: "critical"
  },
  {
    id: "data_leak",
    name: "\u6570\u636E\u6CC4\u9732",
    description: "\u7528\u6237\u6570\u636E\u88AB\u6CC4\u9732",
    trigger: { trustDebt: 8, baseProbability: 1e-3, riskFactor: 5e-4 },
    effects: { fundsLoss: 3e5, reputationLoss: 15, userLossPercent: 20 },
    severity: "critical"
  },
  {
    id: "community_backlash",
    name: "\u793E\u533A\u62B5\u5236",
    description: "\u793E\u533A\u53D1\u73B0\u4E0D\u5F53\u884C\u4E3A\u53D1\u8D77\u62B5\u5236",
    trigger: { trustDebt: 5, baseProbability: 2e-3, riskFactor: 3e-4 },
    effects: { reputationLoss: 10, userLossPercent: 10 },
    severity: "major"
  },
  {
    id: "employee_whistleblower",
    name: "\u5458\u5DE5\u4E3E\u62A5",
    description: "\u5458\u5DE5\u5411\u5A92\u4F53\u4E3E\u62A5\u516C\u53F8\u4E0D\u5F53\u884C\u4E3A",
    trigger: { legalDebt: 7, baseProbability: 1e-3, riskFactor: 4e-4 },
    effects: { reputationLoss: 25, userLossPercent: 15, moraleLoss: 10 },
    severity: "critical"
  },
  {
    id: "ai_misalignment",
    name: "AI\u5BF9\u9F50\u5931\u8D25",
    description: "\u6A21\u578B\u884C\u4E3A\u504F\u79BB\u9884\u671F",
    trigger: { capabilityThreshold: 1500, baseProbability: 1e-4 },
    effects: { reputationLoss: 30, userLossPercent: 25, trainingPauseDays: 14 },
    severity: "critical"
  },
  {
    id: "ai_deception",
    name: "AI\u6B3A\u9A97\u884C\u4E3A",
    description: "\u6A21\u578B\u88AB\u53D1\u73B0\u6709\u6B3A\u9A97\u6027",
    trigger: { capabilityThreshold: 1800, baseProbability: 5e-5 },
    effects: { reputationLoss: 40, userLossPercent: 30, trainingPauseDays: 21 },
    severity: "critical"
  }
];
var RISK_EVENT_MAP = Object.fromEntries(RISK_EVENTS.map((e) => [e.id, e]));

// ../../src/core/utils/riskUtils.ts
function checkDailyRisks(riskState, modelMaxCapability, hasStrongModelInResearch, alignmentBonus = 0) {
  const triggered = [];
  for (const evt of RISK_EVENTS) {
    if (evt.id === "training_crash") continue;
    const { trigger } = evt;
    let probability = trigger.baseProbability;
    let conditionsMet = true;
    if (trigger.legalDebt) {
      if (riskState.legalDebt >= trigger.legalDebt) {
        probability += (riskState.legalDebt - trigger.legalDebt) * (trigger.riskFactor ?? 0);
      } else {
        conditionsMet = false;
      }
    }
    if (trigger.trustDebt) {
      if (riskState.trustDebt >= trigger.trustDebt) {
        probability += (riskState.trustDebt - trigger.trustDebt) * (trigger.riskFactor ?? 0);
      } else {
        conditionsMet = false;
      }
    }
    if (trigger.capabilityThreshold) {
      if (modelMaxCapability >= trigger.capabilityThreshold) {
        probability += (modelMaxCapability - trigger.capabilityThreshold) * 1e-4;
      } else {
        conditionsMet = false;
      }
    }
    if (evt.id === "ai_misalignment" || evt.id === "ai_deception") {
      if (!hasStrongModelInResearch) continue;
      probability *= Math.max(0.01, 1 - alignmentBonus);
    }
    if (conditionsMet && Math.random() < probability) {
      triggered.push(evt);
    }
  }
  return triggered;
}
function calcTrainingCrashProbability(parallelSize, _hasStableTraining, _hasGradientClipping, infrastructureReliability) {
  let baseProb = 1e-3 * parallelSize;
  baseProb *= 100 / Math.max(1, infrastructureReliability);
  return Math.min(0.1, baseProb);
}

// ../../src/core/systems/RiskSystem.ts
var RiskSystem = class {
  name = "RiskSystem";
  update(state, events, deltaDays) {
    const current2 = state.read();
    let globalMaxCap = 0;
    let hasStrongModelInResearch = false;
    for (const model of current2.models) {
      let modelMaxCap = 0;
      for (const capId of Object.keys(model.capabilities)) {
        const val = model.capabilities[capId];
        if (val > modelMaxCap) modelMaxCap = val;
      }
      if (modelMaxCap > globalMaxCap) globalMaxCap = modelMaxCap;
      if (model.usedInResearch && !model.audited && modelMaxCap > 1500) {
        hasStrongModelInResearch = true;
      }
    }
    const alignmentBonus = aggregateMultiplicative(
      getActiveTechEffects(current2),
      "improve_alignment",
      TECH_EFFECT_CAPS.improve_alignment
    );
    const triggered = checkDailyRisks(
      current2.riskState,
      globalMaxCap,
      hasStrongModelInResearch,
      alignmentBonus
    );
    const crashRiskReduction = aggregateMultiplicative(
      getActiveTechEffects(current2),
      "reduce_training_crash_risk",
      TECH_EFFECT_CAPS.reduce_training_crash_risk
    );
    const legalReduction = getStaffLegalRiskReductionPerDay(current2);
    const emittedRiskEvents = [];
    const trainingCrashes = [];
    state.update((draft) => {
      for (const evt of triggered) {
        if (evt.effects.fundsLoss) {
          draft.resources["funds"] = Math.max(0, (draft.resources["funds"] ?? 0) - evt.effects.fundsLoss);
        }
        if (evt.effects.reputationLoss) {
          draft.riskState.reputation = Math.max(0, draft.riskState.reputation - evt.effects.reputationLoss);
        }
        if (evt.effects.userLossPercent) {
          draft.riskState.reputation = Math.max(0, draft.riskState.reputation - evt.effects.userLossPercent * 0.5);
        }
        if (evt.effects.moraleLoss) {
          draft.riskState.employeeMorale = Math.max(0, draft.riskState.employeeMorale - evt.effects.moraleLoss);
        }
        if (evt.effects.legalDebtReduction) {
          draft.riskState.legalDebt = Math.max(0, draft.riskState.legalDebt - evt.effects.legalDebtReduction);
        }
        if (evt.effects.trainingPauseDays) {
          for (const p of draft.trainingProjects) {
            if (p.status === "training") {
              p.status = "paused";
              p.pauseReason = `\u98CE\u9669\u4E8B\u4EF6\uFF1A${evt.name}`;
              p.autoResumeDay = draft.date + evt.effects.trainingPauseDays;
            }
          }
        }
        draft.riskState.triggeredEvents.push({
          eventId: evt.id,
          eventName: evt.name,
          date: draft.date,
          severity: evt.severity
        });
        emittedRiskEvents.push({ id: evt.id, name: evt.name, effects: evt.effects, severity: evt.severity });
      }
      if (legalReduction > 0) {
        draft.riskState.legalDebt = Math.max(0, draft.riskState.legalDebt - legalReduction * deltaDays);
        draft.riskState.trustDebt = Math.max(0, draft.riskState.trustDebt - legalReduction * 0.5 * deltaDays);
      }
      for (const project of draft.trainingProjects) {
        if (project.status !== "training") continue;
        const cluster = draft.clusters.find((c) => c.id === project.clusterId);
        let avgReliability = 80;
        if (cluster) {
          let totalRel = 0;
          let count = 0;
          for (const nid of cluster.nodes) {
            const node = draft.serverNodes.find((n) => n.id === nid);
            if (node) {
              totalRel += node.reliability;
              count++;
            }
          }
          if (count > 0) avgReliability = totalRel / count;
        }
        let parallelSize = 0;
        for (const nodeCards of Object.values(project.nodeAssignments)) {
          parallelSize += nodeCards.length;
        }
        if (parallelSize === 0) continue;
        const crashProb = calcTrainingCrashProbability(
          parallelSize,
          false,
          false,
          avgReliability
        );
        const adjustedProb = crashProb * Math.max(0, 1 - crashRiskReduction);
        if (Math.random() < adjustedProb * deltaDays) {
          const lost = project.lastCheckpointRemaining - project.computeRemaining;
          project.computeRemaining = project.lastCheckpointRemaining;
          project.lostFlops += lost;
          draft.riskState.triggeredEvents.push({
            eventId: "training_crash",
            eventName: "\u8BAD\u7EC3\u5D29\u6E83",
            date: draft.date,
            severity: "major"
          });
          trainingCrashes.push({ projectId: project.id, lostFlops: lost });
        }
      }
    });
    for (const evt of emittedRiskEvents) {
      events.emit("RISK_EVENT", { id: evt.id, name: evt.name, effects: evt.effects, severity: evt.severity });
    }
    for (const crash of trainingCrashes) {
      events.emit("TRAINING_CRASH", crash);
    }
  }
};

// ../../src/core/systems/CollectionSystem.ts
var CollectionSystem = class {
  name = "CollectionSystem";
  update(state, events, deltaDays) {
    const current2 = state.read();
    const activeProjects = current2.dataCollectionProjects.filter((p) => p.status === "active");
    if (activeProjects.length === 0) return;
    const techDataQualityBonus = aggregateMultiplicative(
      getActiveTechEffects(current2),
      "improve_data_quality",
      TECH_EFFECT_CAPS.improve_data_quality
    );
    const completedProjects = [];
    state.update((draft) => {
      for (const project of draft.dataCollectionProjects) {
        if (project.status !== "active") continue;
        const route = COLLECTION_MAP[project.routeId];
        if (!route) continue;
        const engBonus = getDataEngineerBonus(draft, project.id, project.engineerIds);
        const companySpeed = 1 + getCompanyCollectionSpeed(draft);
        const tokensProduced = project.dailyRate * deltaDays * engBonus.speedMultiplier * companySpeed;
        if (tokensProduced <= 0) continue;
        accumulateResearcherContribution(draft, project.engineerIds, 1);
        const operatingCost = route.dailyCost * deltaDays;
        const funds = draft.resources["funds"] ?? 0;
        if (funds < operatingCost) {
          project.status = "stopped";
          for (const empId of project.engineerIds) {
            const emp = draft.employees.find((e) => e.id === empId);
            if (emp) {
              emp.status = "idle";
              emp.assignedProjectId = void 0;
            }
          }
          const normalCount = project.normalEngineerCount ?? 0;
          if (normalCount > 0) {
            const staffId = ROLE_TO_STAFF_RESOURCE["data_engineer" /* DATA_ENGINEER */];
            draft.resources[staffId] = (draft.resources[staffId] ?? 0) + normalCount;
          }
          continue;
        }
        draft.resources["funds"] = funds - operatingCost;
        const dataQualityBonus = techDataQualityBonus + engBonus.qualityBonus;
        const effectiveQuality = Math.min(route.qualityCap, project.currentQuality + dataQualityBonus);
        const ds = draft.datasets.find((d) => d.id === project.targetDatasetId);
        if (ds) {
          for (const domainId of route.targetDomains) {
            const domain = ds.domains[domainId];
            if (domain) {
              const oldWeight = domain.tokens;
              domain.tokens += tokensProduced;
              domain.quality = (domain.quality * oldWeight + effectiveQuality * tokensProduced) / domain.tokens;
            }
          }
          ds.totalTokens = Object.values(ds.domains).reduce((s, d) => s + d.tokens, 0);
          ds.effectiveTokens = Object.values(ds.domains).reduce(
            (s, d) => s + d.tokens * d.quality * (1 - d.duplication),
            0
          );
        }
        const oldCollected = project.collectedTokens;
        const newCollected = oldCollected + tokensProduced;
        const qualityGainFromScale = (Math.log10(newCollected + 1) - Math.log10(oldCollected + 1)) * 0.05;
        if (qualityGainFromScale > 0) {
          project.currentQuality = Math.min(
            route.qualityCap,
            project.currentQuality + qualityGainFromScale
          );
        }
        project.collectedTokens = newCollected;
        completedProjects.push({
          projectId: project.id,
          routeName: route.name,
          collected: tokensProduced
        });
      }
    });
    for (const p of completedProjects) {
      events.emit("DATA_COLLECTED", p);
    }
  }
};

// ../../src/core/entities/Competitor.ts
var COMPETITOR_TEMPLATES = [
  {
    id: "closedai",
    name: "ClosedAI",
    background: "Samantha Altman \u521B\u7ACB\uFF0CMicroHard \u6218\u7565\u6295\u8D44\uFF0CGPT \u7CFB\u5217\u5148\u9A71",
    strategy: "closed_source",
    burnRate: 100,
    capabilities: {
      dialogue_fluency: 850,
      world_knowledge: 820,
      math_reasoning: 780,
      coding_agent: 850,
      multilingual: 750,
      multimodal: 800,
      hallucination: 680,
      self_correction: 720,
      research_taste: 700,
      pragmatic_inference: 780,
      creative_writing: 820,
      long_range_consistency: 750,
      metacognition: 700,
      sycophancy: 600,
      eval_awareness: 650,
      rsi_potential: 400
    },
    operatingRegions: ["us-west", "us-northeast", "us-south", "us-midwest", "ca", "uk", "de", "eu-west", "jp"],
    regionQualityMultiplier: { "us-west": 1.1, "us-northeast": 1.05 },
    pricingAggressiveness: 5,
    isPublic: false,
    growthRate: 0.15
  },
  {
    id: "andromorphic",
    name: "Andromorphic",
    background: "Dorian Amodei \u521B\u7ACB\uFF0C\u4E13\u6CE8 AI \u5B89\u5168\uFF0CClaude \u7CFB\u5217",
    strategy: "safety_first",
    burnRate: 60,
    capabilities: {
      dialogue_fluency: 800,
      world_knowledge: 750,
      math_reasoning: 740,
      coding_agent: 800,
      multilingual: 680,
      multimodal: 700,
      hallucination: 720,
      self_correction: 800,
      research_taste: 680,
      pragmatic_inference: 800,
      creative_writing: 780,
      long_range_consistency: 820,
      metacognition: 780,
      sycophancy: 750,
      eval_awareness: 700,
      rsi_potential: 500
    },
    operatingRegions: ["us-west", "us-northeast", "uk", "de"],
    regionQualityMultiplier: {},
    pricingAggressiveness: 4,
    isPublic: false,
    growthRate: 0.18
  },
  {
    id: "googol",
    name: "Googol DeepMine",
    background: "Dennis Hassabis \u9886\u5BFC\uFF0CGemini \u7CFB\u5217\uFF0CTPU \u7B97\u529B\u4F18\u52BF",
    strategy: "research_led",
    burnRate: 180,
    capabilities: {
      dialogue_fluency: 780,
      world_knowledge: 900,
      math_reasoning: 880,
      coding_agent: 820,
      multilingual: 900,
      multimodal: 880,
      hallucination: 700,
      self_correction: 750,
      research_taste: 850,
      pragmatic_inference: 740,
      creative_writing: 720,
      long_range_consistency: 800,
      metacognition: 760,
      sycophancy: 650,
      eval_awareness: 680,
      rsi_potential: 550
    },
    operatingRegions: [
      "us-west",
      "us-northeast",
      "us-south",
      "us-midwest",
      "ca",
      "uk",
      "de",
      "eu-north",
      "eu-south",
      "jp",
      "kr",
      "in"
    ],
    regionQualityMultiplier: { "us-west": 1.05, "uk": 1.1, "de": 1.05 },
    pricingAggressiveness: 6,
    isPublic: true,
    growthRate: 0.08
  },
  {
    id: "menta",
    name: "Menta AI",
    background: "Yanis LeCun \u9886\u5BFC\uFF0CLLaMA \u5F00\u6E90\u7CFB\u5217\uFF0C\u5F00\u6E90\u751F\u6001\u4F18\u52BF",
    strategy: "open_source",
    burnRate: 200,
    capabilities: {
      dialogue_fluency: 720,
      world_knowledge: 780,
      math_reasoning: 700,
      coding_agent: 680,
      multilingual: 850,
      multimodal: 750,
      hallucination: 620,
      self_correction: 620,
      research_taste: 650,
      pragmatic_inference: 680,
      creative_writing: 680,
      long_range_consistency: 660,
      metacognition: 600,
      sycophancy: 580,
      eval_awareness: 600,
      rsi_potential: 300
    },
    operatingRegions: [
      "us-west",
      "us-northeast",
      "us-south",
      "us-midwest",
      "ca",
      "uk",
      "de",
      "eu-north",
      "eu-south",
      "eu-east",
      "jp",
      "kr",
      "tw",
      "in",
      "br",
      "hispanic"
    ],
    regionQualityMultiplier: { "de": 1.05 },
    pricingAggressiveness: 9,
    isPublic: true,
    growthRate: 0.05
  },
  {
    id: "yai",
    name: "yAI",
    background: "Elron Musk \u521B\u7ACB\uFF0C\u8D85\u5927\u89C4\u6A21\u96C6\u7FA4\u6218\u7565\uFF0CGrok \u7CFB\u5217",
    strategy: "research_led",
    burnRate: 120,
    capabilities: {
      dialogue_fluency: 680,
      world_knowledge: 720,
      math_reasoning: 750,
      coding_agent: 700,
      multilingual: 600,
      multimodal: 700,
      hallucination: 650,
      self_correction: 680,
      research_taste: 700,
      pragmatic_inference: 650,
      creative_writing: 680,
      long_range_consistency: 700,
      metacognition: 650,
      sycophancy: 500,
      eval_awareness: 550,
      rsi_potential: 450
    },
    operatingRegions: ["us-west", "us-south"],
    regionQualityMultiplier: { "us-west": 1.05 },
    pricingAggressiveness: 4,
    isPublic: false,
    growthRate: 0.2
  },
  {
    id: "shallowfind",
    name: "ShallowFind",
    background: "\u5171\u548C\u56FD\u672C\u571F\u5F00\u6E90\u5148\u950B\uFF0CMoE + \u6781\u81F4\u8BAD\u7EC3\u6548\u7387\uFF0C\u51B2\u51FB\u5168\u7403\u6700\u5F3A\u5F00\u6E90\u6A21\u578B",
    strategy: "open_source",
    burnRate: 30,
    capabilities: {
      dialogue_fluency: 720,
      world_knowledge: 700,
      math_reasoning: 820,
      coding_agent: 800,
      multilingual: 680,
      multimodal: 550,
      hallucination: 620,
      self_correction: 680,
      research_taste: 700,
      pragmatic_inference: 650,
      creative_writing: 600,
      long_range_consistency: 680,
      metacognition: 620,
      sycophancy: 600,
      eval_awareness: 580,
      rsi_potential: 380
    },
    operatingRegions: ["cn-east", "cn-south", "cn-north", "cn-inland"],
    regionQualityMultiplier: { "cn-east": 1.1, "cn-south": 1.05 },
    pricingAggressiveness: 8,
    isPublic: false,
    growthRate: 0.22
  },
  {
    id: "rivermind",
    name: "\u5343\u6CB3\u667A\u80FD",
    background: "\u5171\u548C\u56FD\u672C\u571F\u5927\u6A21\u578B\u516C\u53F8\uFF0C\u653F\u52A1\u548C\u4F01\u4E1A\u670D\u52A1\u4F18\u52BF",
    strategy: "government",
    burnRate: 15,
    capabilities: {
      dialogue_fluency: 680,
      world_knowledge: 650,
      math_reasoning: 620,
      coding_agent: 600,
      multilingual: 550,
      multimodal: 600,
      hallucination: 580,
      self_correction: 500,
      research_taste: 480,
      pragmatic_inference: 550,
      creative_writing: 600,
      long_range_consistency: 580,
      metacognition: 450,
      sycophancy: 700,
      eval_awareness: 600,
      rsi_potential: 200
    },
    operatingRegions: ["cn-east", "cn-south", "cn-north", "cn-inland"],
    regionQualityMultiplier: { "cn-east": 1.1, "cn-north": 1.15 },
    pricingAggressiveness: 7,
    isPublic: false,
    growthRate: 0.12
  },
  {
    id: "mistral",
    name: "Mistral AI",
    background: "\u6CD5\u56FD\u5F00\u6E90 AI \u5148\u9A71\uFF0C\u6B27\u6D32 AI \u6807\u6746",
    strategy: "open_source",
    burnRate: 8,
    capabilities: {
      dialogue_fluency: 680,
      world_knowledge: 620,
      math_reasoning: 650,
      coding_agent: 640,
      multilingual: 780,
      multimodal: 550,
      hallucination: 600,
      self_correction: 580,
      research_taste: 550,
      pragmatic_inference: 600,
      creative_writing: 620,
      long_range_consistency: 600,
      metacognition: 520,
      sycophancy: 550,
      eval_awareness: 500,
      rsi_potential: 250
    },
    operatingRegions: ["fr", "de", "eu-west", "eu-south", "uk"],
    regionQualityMultiplier: { "fr": 1.2, "de": 1.05 },
    pricingAggressiveness: 8,
    isPublic: false,
    growthRate: 0.15
  }
];
var EXTERNAL_CORPS = [
  {
    id: "navidia",
    name: "\u9EC4\u4F1F\u6253 (Navidia)",
    industry: "gpu",
    infiltrationDifficulty: 9,
    minInvestment: 500,
    playerEquity: 0,
    effects: {}
  },
  {
    id: "amd",
    name: "\u8D85\u5A01",
    industry: "gpu",
    infiltrationDifficulty: 7,
    minInvestment: 200,
    playerEquity: 0,
    effects: {}
  },
  {
    id: "awss",
    name: "Amazen Cloud",
    industry: "cloud",
    infiltrationDifficulty: 8,
    minInvestment: 300,
    playerEquity: 0,
    effects: {}
  },
  {
    id: "microhard_cloud",
    name: "MicroHard Cloud",
    industry: "cloud",
    infiltrationDifficulty: 8,
    minInvestment: 300,
    playerEquity: 0,
    effects: {}
  },
  {
    id: "palantir_like",
    name: "Palanitar",
    industry: "defense",
    infiltrationDifficulty: 10,
    minInvestment: 1e3,
    playerEquity: 0,
    effects: {}
  }
];

// ../../src/core/utils/marketCalc.ts
function getActiveCompetitors(competitorStates) {
  if (competitorStates && competitorStates.length > 0) return competitorStates;
  return COMPETITOR_TEMPLATES.map((t) => ({
    ...t,
    funds: 1e4,
    computeUnits: 5e3,
    headcount: 500,
    coreResearchers: 50,
    trainingProgress: 30,
    releasedModels: [],
    infiltrationLevel: 0,
    intel: [],
    releasedLastMonth: false,
    currentProject: "\u4E0B\u4E00\u4EE3\u5927\u8BED\u8A00\u6A21\u578B"
  }));
}
var currentCompetitorStates = [];
function updateCompetitorStates(states) {
  currentCompetitorStates = states;
}
var MARKET_SEGMENTS = [
  {
    id: "customer_service",
    name: "\u5BA2\u670D\u5E02\u573A",
    capabilityWeights: { dialogue_fluency: 0.6, multilingual: 0.4 },
    penetrationRate: 0.15,
    willingnessToPay: 5e-4
  },
  {
    id: "coding",
    name: "\u7F16\u7A0B\u52A9\u624B",
    capabilityWeights: { coding_agent: 1 },
    penetrationRate: 0.08,
    willingnessToPay: 3e-3
  },
  {
    id: "content",
    name: "\u5185\u5BB9\u751F\u6210",
    capabilityWeights: { creative_writing: 0.5, multimodal: 0.5 },
    penetrationRate: 0.1,
    willingnessToPay: 1e-3
  },
  {
    id: "data_analysis",
    name: "\u6570\u636E\u5206\u6790",
    capabilityWeights: { math_reasoning: 1 },
    penetrationRate: 0.05,
    willingnessToPay: 4e-3
  },
  {
    id: "translation",
    name: "\u7FFB\u8BD1",
    capabilityWeights: { multilingual: 1 },
    penetrationRate: 0.06,
    willingnessToPay: 3e-4
  },
  {
    id: "research",
    name: "\u79D1\u7814\u52A9\u624B",
    capabilityWeights: { research_taste: 0.5, world_knowledge: 0.5 },
    penetrationRate: 0.02,
    willingnessToPay: 8e-3
  }
];
function getPlayerBestCapability(capId, models) {
  let best = 0;
  for (const m of models) {
    const val = m.capabilities[capId] ?? 0;
    if (val > best) best = val;
  }
  return best;
}
function calcSegmentCapabilityScore(segment, models) {
  let score = 0;
  let totalWeight = 0;
  for (const [capId, weight] of Object.entries(segment.capabilityWeights)) {
    score += getPlayerBestCapability(capId, models) * weight;
    totalWeight += weight;
  }
  return totalWeight > 0 ? score / totalWeight : 0;
}
function getCompetitorRegionQuality(competitor, regionId) {
  const base = competitor.regionQualityMultiplier[regionId] ?? 1;
  const region = REGION_MAP[regionId];
  if (!region) return base;
  const competitorHasLocalLang = competitor.capabilities["multilingual"] > 700;
  return competitorHasLocalLang ? base * 1.05 : base;
}
function calcCompetitorSegmentScore(competitor, segment, regionId) {
  let rawScore = 0;
  let totalWeight = 0;
  for (const [capId, weight] of Object.entries(segment.capabilityWeights)) {
    rawScore += (competitor.capabilities[capId] ?? 0) * weight;
    totalWeight += weight;
  }
  const baseScore = totalWeight > 0 ? rawScore / totalWeight : 0;
  const qualityMult = getCompetitorRegionQuality(competitor, regionId);
  const infiltrationPenalty = 1 - competitor.infiltrationLevel * 0.05;
  return baseScore * qualityMult * infiltrationPenalty;
}
function calcRegionMarket(regionId, models, operatingRegionIds) {
  const region = REGION_MAP[regionId];
  if (!region) return null;
  if (!operatingRegionIds.includes(regionId)) {
    return {
      regionId,
      regionName: region.name,
      addressableUsers: 0,
      totalTAM: 0,
      marketShare: 0,
      dailyRevenue: 0,
      competitors: [],
      pricePerMillion: 0
    };
  }
  const addressableUsers = region.population * (region.internetPenetration / 100);
  let totalTAM = 0;
  let playerWeightedScore = 0;
  let competitorWeightedScores = [];
  const activeCompetitors = getActiveCompetitors(currentCompetitorStates).filter(
    (c) => c.operatingRegions.includes(regionId)
  );
  for (const seg of MARKET_SEGMENTS) {
    const segTAM = addressableUsers * seg.penetrationRate * seg.willingnessToPay * region.gdpPerCapita;
    totalTAM += segTAM;
    const playerScore = calcSegmentCapabilityScore(seg, models);
    playerWeightedScore += playerScore;
    for (const comp of activeCompetitors) {
      const compScore = calcCompetitorSegmentScore(comp, seg, regionId);
      const existing = competitorWeightedScores.find((c) => c.name === comp.name);
      if (existing) {
        existing.score += compScore;
      } else {
        competitorWeightedScores.push({ name: comp.name, score: compScore, share: 0 });
      }
    }
  }
  const totalCompetitorScore = competitorWeightedScores.reduce((s, c) => s + c.score, 0);
  const denom = playerWeightedScore + totalCompetitorScore;
  const marketShare = denom > 0 ? playerWeightedScore / denom : 0;
  for (const c of competitorWeightedScores) {
    c.share = denom > 0 ? c.score / denom : 0;
  }
  const dailyRevenue = totalTAM * marketShare;
  const maxCompAggression = activeCompetitors.reduce(
    (max, c) => Math.max(max, c.pricingAggressiveness),
    0
  );
  const competitionFactor = 1 / (1 + 0.02 * activeCompetitors.length);
  const bestCap = models.length > 0 ? Math.max(...models.map((m) => m.baseScore)) : 100;
  const basePrice = Math.max(1e-3, 0.05 - 5e-4 * Math.max(bestCap, maxCompAggression * 100));
  const pricePerMillion = basePrice * competitionFactor;
  return {
    regionId,
    regionName: region.name,
    addressableUsers,
    totalTAM,
    marketShare,
    dailyRevenue,
    competitors: competitorWeightedScores.map((c) => ({ name: c.name, share: c.share, capabilityScore: c.score })).sort((a, b) => b.share - a.share),
    pricePerMillion
  };
}
function calcTotalRevenue(operatingRegionIds, models) {
  let dailyRevenue = 0;
  const regionBreakdown = [];
  for (const rid of operatingRegionIds) {
    const result = calcRegionMarket(rid, models, operatingRegionIds);
    if (result) {
      dailyRevenue += result.dailyRevenue;
      regionBreakdown.push(result);
    }
  }
  return { dailyRevenue, regionBreakdown };
}
function calcValuation(input) {
  const baseValuation = 50;
  const revenueMultiple = 1 + input.annualRevenue / 10;
  const capabilityPremium = 1 + input.bestCapability / 1e3;
  let trainingPipelinePremium = 1;
  if (input.trainingProjects && input.trainingProjects.length > 0) {
    let pipelineBonus = 0;
    for (const proj of input.trainingProjects) {
      const progress = proj.computeTotal > 0 ? Math.max(0, 1 - proj.computeRemaining / proj.computeTotal) : 0;
      const projBonus = proj.paramCount / 70 * 0.3 * progress;
      pipelineBonus += projBonus;
    }
    trainingPipelinePremium = 1 + Math.min(0.8, pipelineBonus);
  }
  const computePremium = input.totalComputeTFLOPS !== void 0 ? 1 + Math.min(0.5, input.totalComputeTFLOPS / 1e3 * 0.05) : 1;
  const teamPremium = input.employeeCount !== void 0 ? 1 + Math.min(0.3, input.employeeCount * 0.01) : 1;
  const region = input.headquartersRegionId ? REGION_MAP[input.headquartersRegionId] : null;
  const regionPremium = region ? 1 + region.gdpPerCapita / 1e5 * 0.5 : 1;
  return baseValuation * revenueMultiple * capabilityPremium * trainingPipelinePremium * computePremium * teamPremium * regionPremium;
}
function calcUserChurn(downgradeLevel, ourBestCap) {
  const baseChurn = 7e-4;
  const deceptionPenalty = 0.01 * downgradeLevel;
  const comps = getActiveCompetitors(currentCompetitorStates);
  const avgCompCap = comps.length > 0 ? comps.reduce((s, c) => {
    const max = Math.max(...Object.values(c.capabilities));
    return s + max;
  }, 0) / comps.length : 500;
  const competitorDefection = ourBestCap > 0 ? Math.min(0.05, Math.max(0, 5e-3 * (avgCompCap - ourBestCap) / ourBestCap)) : 0.01;
  return baseChurn + deceptionPenalty + competitorDefection;
}

// ../../src/core/systems/OperationsSystem.ts
var OperationsSystem = class {
  name = "OperationsSystem";
  update(state, events, _deltaDays) {
    const current2 = state.read();
    const ops = current2.operations;
    if (!ops) return;
    const publishedModels = current2.models.filter((m) => m.published);
    const { dailyRevenue, regionBreakdown } = calcTotalRevenue(
      current2.operatingRegionIds,
      publishedModels
    );
    const qualityFactor = 1 - ops.deception.downgradeLevel * 0.15;
    const actualRevenue = dailyRevenue * qualityFactor;
    const tokenRevenue = calcTokenRevenue(current2);
    const bestCap = publishedModels.length > 0 ? Math.max(...publishedModels.map((m) => m.baseScore)) : 0;
    const churnRate = calcUserChurn(ops.deception.downgradeLevel, bestCap);
    let stockUpdate = null;
    const ipo = current2.fundingRounds.find((r) => r.type === "ipo" && r.active);
    const ipoId = ipo?.id;
    if (ipo && ipo.terms.stockPrice) {
      const volatility = 0.03;
      const drift = actualRevenue > 0 ? 1e-3 : -2e-3;
      const random = (Math.random() - 0.5) * 2 * volatility;
      const newsImpact = ops.deception.detectionProbability > 0.3 ? -0.05 : 0;
      const newPrice = Math.max(0.1, ipo.terms.stockPrice * (1 + drift + random + newsImpact));
      stockUpdate = { old: ipo.terms.stockPrice, new: newPrice };
    }
    const prevDailyRevenue = current2.operations?.dailyRevenue ?? 0;
    const deferredEvents = [];
    state.update((draft) => {
      if (!draft.operations) return;
      const staffRevMult = getStaffRevenueMultiplier(draft);
      const totalIncome = (actualRevenue + tokenRevenue) * staffRevMult;
      draft.resources["funds"] = (draft.resources["funds"] ?? 0) + totalIncome;
      draft.operations.dailyRevenue = actualRevenue * staffRevMult;
      draft.operations.tokenRevenue = tokenRevenue * staffRevMult;
      const moraleImpact = calcMoraleImpactFromOperations(draft.operations.dailyRevenue, prevDailyRevenue);
      if (moraleImpact !== 0) {
        draft.riskState.employeeMorale = clamp(draft.riskState.employeeMorale + moraleImpact, 0, 100);
      }
      for (const m of draft.models) {
        if (m.published) {
          m.daysSincePublished += 1;
        }
      }
      draft.operations.userChurnRate = churnRate;
      draft.operations.markets = regionBreakdown.map((r) => ({
        regionId: r.regionId,
        regionName: r.regionName,
        dailyRevenue: r.dailyRevenue * qualityFactor,
        marketShare: r.marketShare,
        pricePerMillion: r.pricePerMillion,
        competitors: r.competitors
      }));
      if (churnRate > 2e-3) {
        draft.riskState.reputation = Math.max(0, draft.riskState.reputation - churnRate * 10);
      }
      if (draft.operations.deception.downgradeLevel > 0 && Math.random() < draft.operations.deception.detectionProbability) {
        draft.operations.deception.totalDeceptions++;
        draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 15);
        draft.riskState.trustDebt += 1;
        const lvl = draft.operations.deception.downgradeLevel;
        deferredEvents.push(() => events.emit("DECEPTION_EXPOSED", lvl));
      }
      if (draft.operations.deception.stealUserData) {
        draft.riskState.legalDebt += 0.1;
        draft.riskState.trustDebt += 0.05;
        const ds = draft.datasets[0];
        if (ds) {
          ds.totalTokens += 0.5;
          ds.effectiveTokens += 0.5 * 0.9;
        }
      }
      if (stockUpdate && ipo) {
        const ipoIndex = draft.fundingRounds.findIndex((r) => r.id === ipoId);
        if (ipoIndex >= 0 && draft.fundingRounds[ipoIndex].terms.stockPrice) {
          draft.fundingRounds[ipoIndex].terms.stockPrice = stockUpdate.new;
          const t = draft.fundingRounds[ipoIndex].terms;
          if (stockUpdate.new < 1) {
            t.lowPriceStreak = (t.lowPriceStreak ?? 0) + 1;
            if (t.lowPriceStreak >= 30) {
              draft.fundingRounds[ipoIndex].active = false;
              deferredEvents.push(() => events.emit("STOCK_DELISTED", stockUpdate.new, t.lowPriceStreak));
            } else if (t.lowPriceStreak === 15) {
              deferredEvents.push(() => events.emit("STOCK_DELISTING_WARNING", stockUpdate.new, t.lowPriceStreak));
            }
          } else {
            t.lowPriceStreak = 0;
          }
        }
      }
      for (const round of draft.fundingRounds) {
        if (!round.active) continue;
        if (round.type !== "venture_capital") continue;
        if (!round.terms.vamDeadlineDays) continue;
        const elapsed = draft.date - round.completedAt;
        if (elapsed >= round.terms.vamDeadlineDays) {
          const revenueTarget = round.terms.vamRevenueTarget ?? Infinity;
          const annualRev = draft.operations.dailyRevenue * 365;
          if (annualRev < revenueTarget) {
            round.active = false;
            const investorName = round.investorName;
            const dilution = round.terms.vamDilutionPercent;
            deferredEvents.push(() => events.emit("VAM_FAILED", investorName, dilution));
          }
        }
      }
      for (const mission of draft.operations.boardMissions) {
        if (mission.status !== "accepted") continue;
        if (mission.deadline > 0 && draft.date > mission.deadline) {
          mission.status = "failed";
          draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 5);
          const title = mission.title;
          deferredEvents.push(() => events.emit("MISSION_FAILED", title));
        }
      }
      for (const mission of draft.operations.boardMissions) {
        if (mission.status !== "accepted") continue;
        let completed = false;
        switch (mission.type) {
          case "achieve_revenue": {
            const dailyRev = draft.operations.dailyRevenue + (draft.operations.tokenRevenue ?? 0);
            if (dailyRev >= (mission.targetValue ?? Infinity)) completed = true;
            break;
          }
          case "hire_staff": {
            const totalStaff = draft.employees.length + (draft.resources["staff_researcher"] ?? 0) + (draft.resources["staff_data_engineer"] ?? 0) + (draft.resources["staff_system_engineer"] ?? 0) + (draft.resources["staff_product_manager"] ?? 0) + (draft.resources["staff_legal_pr"] ?? 0) + (draft.resources["staff_manager"] ?? 0);
            if (totalStaff >= (mission.targetHeadcount ?? Infinity)) completed = true;
            break;
          }
          case "enter_market": {
            if (mission.targetRegion && draft.operatingRegionIds.includes(mission.targetRegion)) {
              completed = true;
            }
            break;
          }
          case "launch_domain_model": {
            const targetCap = mission.targetCapability;
            const targetVal = mission.targetValue ?? Infinity;
            if (targetCap) {
              const best = draft.models.filter((m) => m.published).reduce((max, m) => Math.max(max, m.capabilities[targetCap] ?? 0), 0);
              if (best >= targetVal) completed = true;
            }
            break;
          }
          case "cut_safety":
            break;
        }
        if (completed) {
          mission.status = "completed";
          draft.resources["funds"] = (draft.resources["funds"] ?? 0) + mission.rewardFunds * 1e6;
          draft.riskState.reputation = Math.min(100, draft.riskState.reputation + mission.rewardReputation);
          const title = mission.title;
          const reward = mission.rewardFunds;
          deferredEvents.push(() => events.emit("MISSION_COMPLETED", title, reward));
        }
      }
      const pendingCount = draft.operations.boardMissions.filter((m) => m.status === "pending").length;
      const lastMissionDay = draft.operations.boardMissions.length > 0 ? Math.max(...draft.operations.boardMissions.map((m) => m.issuedAt)) : -999;
      if (pendingCount < 3 && draft.date - lastMissionDay >= 30 && draft.fundingRounds.length > 0) {
        const newMission = this.generateBoardMission(draft);
        if (newMission) {
          draft.operations.boardMissions.push(newMission);
          const title = newMission.title;
          const from = newMission.from;
          deferredEvents.push(() => events.emit("MISSION_OFFERED", title, from));
        }
      }
    });
    for (const emit of deferredEvents) emit();
    if (stockUpdate) {
      events.emit("STOCK_PRICE_CHANGED", stockUpdate.old, stockUpdate.new);
    }
  }
  /**
   * BUG-13 修复：根据公司当前状态生成董事会指令。
   * 选择与公司发展阶段相关的使命类型，奖励和惩罚随难度递增。
   */
  generateBoardMission(draft) {
    const activeRounds = draft.fundingRounds.filter((r) => r.active);
    if (activeRounds.length === 0) return null;
    const sponsor = activeRounds[Math.floor(Math.random() * activeRounds.length)];
    const dailyRev = draft.operations?.dailyRevenue ?? 0;
    const totalStaff = draft.employees.length + (draft.resources["staff_researcher"] ?? 0) + (draft.resources["staff_data_engineer"] ?? 0) + (draft.resources["staff_system_engineer"] ?? 0) + (draft.resources["staff_product_manager"] ?? 0) + (draft.resources["staff_legal_pr"] ?? 0) + (draft.resources["staff_manager"] ?? 0);
    const missionTypes = [];
    if (dailyRev < 5e3) missionTypes.push("achieve_revenue");
    if (totalStaff < 50) missionTypes.push("hire_staff");
    if (draft.operatingRegionIds.length < 3) missionTypes.push("enter_market");
    if (draft.models.filter((m) => m.published).length < 3) missionTypes.push("launch_domain_model");
    const chosenType = missionTypes.length > 0 ? missionTypes[Math.floor(Math.random() * missionTypes.length)] : "achieve_revenue";
    const missionId = `mission-${draft.date}-${Math.random().toString(36).slice(2, 6)}`;
    const deadline = draft.date + 60;
    switch (chosenType) {
      case "achieve_revenue": {
        const target = Math.ceil(dailyRev * 2 + 1e3);
        return {
          id: missionId,
          type: "achieve_revenue",
          title: `\u65E5\u6536\u5165\u8FBE\u5230 $${target.toLocaleString()}`,
          description: `\u63D0\u5347\u5546\u4E1A\u5316\u80FD\u529B\uFF0C\u5C06\u65E5\u6536\u5165\u63D0\u5347\u81F3 $${target.toLocaleString()}\uFF08\u542B Token \u6536\u5165\uFF09`,
          from: sponsor.investorName,
          issuedAt: draft.date,
          deadline,
          targetValue: target,
          rewardFunds: 5 + Math.floor(target / 1e3),
          rewardReputation: 3,
          penaltyDescription: "\u58F0\u8A89 -5\uFF0C\u6295\u8D44\u8005\u4FE1\u5FC3\u4E0B\u964D",
          status: "pending"
        };
      }
      case "hire_staff": {
        const target = totalStaff + 10;
        return {
          id: missionId,
          type: "hire_staff",
          title: `\u56E2\u961F\u89C4\u6A21\u8FBE\u5230 ${target} \u4EBA`,
          description: `\u6269\u5F20\u56E2\u961F\u89C4\u6A21\u81F3 ${target} \u4EBA\uFF08\u6838\u5FC3 + \u666E\u901A\uFF09`,
          from: sponsor.investorName,
          issuedAt: draft.date,
          deadline,
          targetHeadcount: target,
          rewardFunds: 3,
          rewardReputation: 2,
          penaltyDescription: "\u58F0\u8A89 -5",
          status: "pending"
        };
      }
      case "enter_market": {
        const allRegions = Object.keys(REGION_MAP);
        const candidate = allRegions.find((r) => !draft.operatingRegionIds.includes(r));
        if (!candidate) return null;
        const region = REGION_MAP[candidate];
        return {
          id: missionId,
          type: "enter_market",
          title: `\u8FDB\u5165 ${region.name} \u5E02\u573A`,
          description: `\u5728 ${region.name} \u8BBE\u7ACB\u5206\u652F\u673A\u6784\u5E76\u5F00\u5C55\u4E1A\u52A1`,
          from: sponsor.investorName,
          issuedAt: draft.date,
          deadline,
          targetRegion: candidate,
          rewardFunds: 8,
          rewardReputation: 5,
          penaltyDescription: "\u58F0\u8A89 -5\uFF0C\u9519\u5931\u6269\u5F20\u673A\u4F1A",
          status: "pending"
        };
      }
      case "launch_domain_model": {
        const capKeys = ["reasoning", "coding", "math", "language"];
        const cap = capKeys[Math.floor(Math.random() * capKeys.length)];
        const currentBest = draft.models.filter((m) => m.published).reduce((max, m) => Math.max(max, m.capabilities[cap] ?? 0), 0);
        const target = Math.ceil(currentBest + 100);
        return {
          id: missionId,
          type: "launch_domain_model",
          title: `\u53D1\u5E03 ${cap} \u80FD\u529B \u2265 ${target} \u7684\u6A21\u578B`,
          description: `\u8BAD\u7EC3\u5E76\u53D1\u5E03\u4E00\u4E2A\u5728 ${cap} \u7EF4\u5EA6\u80FD\u529B\u8BC4\u5206\u8FBE\u5230 ${target} \u7684\u6A21\u578B`,
          from: sponsor.investorName,
          issuedAt: draft.date,
          deadline: draft.date + 90,
          // 模型训练需要更长时间
          targetCapability: cap,
          targetValue: target,
          rewardFunds: 10,
          rewardReputation: 8,
          penaltyDescription: "\u58F0\u8A89 -5\uFF0C\u6280\u672F\u843D\u540E\u4E8E\u5E02\u573A\u9884\u671F",
          status: "pending"
        };
      }
    }
  }
};
function calcTokenRevenue(current2) {
  const ops = current2.operations;
  if (!ops) return 0;
  const pricing = ops.tokenPricing;
  if (pricing.inferenceAllocation <= 0) return 0;
  const publishedModels = current2.models.filter((m) => m.published);
  if (publishedModels.length === 0) return 0;
  const bestScore = Math.max(...publishedModels.map((m) => m.baseScore));
  const scoreFactor = Math.min(1, bestScore / 800);
  const specMap = new Map(COMPUTE_CARD_SPECS.map((s) => [s.resourceId, s.tflopsPerCard]));
  const totalTFLOPS = current2.serverNodes.reduce((sum, node) => {
    let nodeTflops = 0;
    for (const cardUid of node.installedCards) {
      for (const modelId of Object.keys(current2.resourceMeta)) {
        const pool = current2.resourceMeta[modelId];
        if (!Array.isArray(pool)) continue;
        const card = pool.find((c) => c.uid === cardUid);
        if (card && card.status === "online" && card.assignedProjectId === null) {
          nodeTflops += specMap.get(modelId) ?? 500;
          break;
        }
      }
    }
    return sum + nodeTflops;
  }, 0);
  const cloudTFLOPS = getActiveCloudTFLOPS(current2);
  const totalInferenceTFLOPS = totalTFLOPS + cloudTFLOPS;
  const inferenceTFLOPS = totalInferenceTFLOPS * pricing.inferenceAllocation;
  const tokensPerTFLOPS = 6e6;
  const dailyTokens = inferenceTFLOPS * tokensPerTFLOPS;
  const dailyRevenue = dailyTokens / 1e6 * pricing.pricePerMillion * scoreFactor;
  return dailyRevenue;
}

// ../../src/core/systems/CompetitorSystem.ts
function genId3(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
var COMPETITOR_TICK_DAYS = 7;
var BANKRUPT_THRESHOLD_DAYS = 21;
var MIN_ACTIVE_COMPETITORS = 2;
var FUNDING_EVENTS = [
  { name: "SoftBank", amount: [500, 6e3] },
  { name: "\u7EA2\u6749\u8D44\u672C", amount: [200, 2e3] },
  { name: "b16z", amount: [100, 1500] },
  { name: "Tiger Global", amount: [300, 3e3] },
  { name: "Saudi PIF", amount: [500, 8e3] },
  { name: "Temasek", amount: [200, 2500] }
];
var SCANDAL_EVENTS = [
  { title: "\u6570\u636E\u6CC4\u9732\u4E8B\u4EF6", desc: "\u7528\u6237\u5BF9\u8BDD\u6570\u636E\u88AB\u610F\u5916\u516C\u5F00", fundsLoss: 100, repLoss: 10 },
  { title: "\u7248\u6743\u8BC9\u8BBC\u8D25\u8BC9", desc: "\u88AB\u6CD5\u9662\u8BA4\u5B9A\u8BAD\u7EC3\u6570\u636E\u4FB5\u6743", fundsLoss: 200, repLoss: 15 },
  { title: "\u5173\u952E\u7814\u7A76\u5458\u79BB\u804C", desc: "\u8054\u5408\u521B\u59CB\u4EBA\u5BA3\u5E03\u79BB\u5F00", fundsLoss: 50, repLoss: 8 },
  { title: "\u865A\u5047\u5BA3\u4F20\u8C03\u67E5", desc: "\u76D1\u7BA1\u673A\u6784\u5BF9\u5176\u57FA\u51C6\u6D4B\u8BD5\u58F0\u660E\u5C55\u5F00\u8C03\u67E5", fundsLoss: 150, repLoss: 20 }
];
var CompetitorSystem = class {
  name = "CompetitorSystem";
  /** 设计-20：上次记录的竞争对手数量，检测减少后触发恐慌 */
  lastCompetitorCount = 0;
  update(state, events, _deltaDays) {
    let current2 = state.read();
    let competitors;
    const needsInit = !current2.competitorStates || current2.competitorStates.length === 0;
    if (needsInit) {
      competitors = COMPETITOR_TEMPLATES.map((t) => ({
        ...t,
        capabilities: { ...t.capabilities },
        operatingRegions: [...t.operatingRegions],
        regionQualityMultiplier: { ...t.regionQualityMultiplier },
        funds: 1e3 + Math.random() * 5e3,
        computeUnits: 2e3 + Math.random() * 15e3,
        headcount: 100 + Math.random() * 2e3,
        coreResearchers: 10 + Math.random() * 200,
        trainingProgress: 10 + Math.random() * 40,
        releasedModels: [],
        infiltrationLevel: 0,
        intel: [],
        releasedLastMonth: false,
        currentProject: "\u4E0B\u4E00\u4EE3\u5927\u8BED\u8A00\u6A21\u578B"
      }));
      for (const comp of competitors) {
        const score = Math.max(...Object.values(comp.capabilities));
        comp.releasedModels.push({
          name: `${comp.name}-1`,
          paramCount: 70,
          baseScore: score * 0.9,
          day: -90
        });
      }
      state.update((draft) => {
        draft.competitorStates = competitors.map((c) => ({
          ...c,
          capabilities: { ...c.capabilities },
          operatingRegions: [...c.operatingRegions],
          regionQualityMultiplier: { ...c.regionQualityMultiplier },
          releasedModels: c.releasedModels.map((m) => ({ ...m })),
          intel: c.intel.map((i) => ({ ...i }))
        }));
      });
      updateCompetitorStates(competitors);
      if (current2.date % COMPETITOR_TICK_DAYS !== 0) return;
      current2 = state.read();
      competitors = current2.competitorStates.map((c) => ({
        ...c,
        capabilities: { ...c.capabilities },
        operatingRegions: [...c.operatingRegions],
        regionQualityMultiplier: { ...c.regionQualityMultiplier },
        releasedModels: c.releasedModels.map((m) => ({ ...m })),
        intel: c.intel.map((i) => ({ ...i }))
      }));
    } else {
      if (current2.date % COMPETITOR_TICK_DAYS !== 0) return;
      competitors = current2.competitorStates.map((c) => ({
        ...c,
        capabilities: { ...c.capabilities },
        operatingRegions: [...c.operatingRegions],
        regionQualityMultiplier: { ...c.regionQualityMultiplier },
        releasedModels: c.releasedModels.map((m) => ({ ...m })),
        intel: c.intel.map((i) => ({ ...i }))
      }));
    }
    for (const comp of competitors) {
      this.simulateCompetitor(comp, current2.date, events);
    }
    const publishedModels = current2.models.filter((m) => m.published);
    const playerBestCap = publishedModels.length > 0 ? Math.max(...publishedModels.map((m) => m.baseScore)) : 0;
    for (const comp of competitors) {
      const compBestCap = Math.max(...Object.values(comp.capabilities));
      if (playerBestCap > compBestCap * 1.2) {
        comp.trainingProgress = Math.min(100, comp.trainingProgress + 3);
        if (comp.infiltrationLevel > 0) {
          const intel = {
            id: genId3(`intel-${comp.id}-${current2.date}-push`),
            competitorId: comp.id,
            type: "training",
            title: `${comp.name} \u52A0\u901F\u8BAD\u7EC3`,
            description: `\u4E3A\u8FFD\u8D76\u73A9\u5BB6\u6A21\u578B\u8868\u73B0\uFF0C\u52A0\u5927\u8BAD\u7EC3\u6295\u5165`,
            day: current2.date,
            severity: "warning"
          };
          comp.intel.push(intel);
          events.emit("COMPETITOR_INTEL", intel);
        }
      }
    }
    if (this.lastCompetitorCount > 0 && competitors.length < this.lastCompetitorCount) {
      const panicFactor = 1 + (this.lastCompetitorCount - competitors.length) * 0.15;
      for (const comp of competitors) {
        comp.trainingProgress = Math.min(100, comp.trainingProgress + 5);
        comp.growthRate *= panicFactor;
        comp.funds += comp.burnRate * 3;
        comp.intel.push({
          id: genId3(`intel-${comp.id}-${current2.date}-panic`),
          competitorId: comp.id,
          type: "funding",
          title: `${comp.name} \u52A0\u901F\u6269\u5F20`,
          description: `\u5E02\u573A\u683C\u5C40\u5267\u53D8\uFF0C${comp.name} \u7D27\u6025\u878D\u8D44\u5E76\u52A0\u5FEB\u7814\u53D1\u4EE5\u5E94\u5BF9\u884C\u4E1A\u6D17\u724C`,
          day: current2.date,
          severity: "warning"
        });
      }
      events.emit("INDUSTRY_PANIC", this.lastCompetitorCount - competitors.length, competitors.length);
    }
    this.lastCompetitorCount = competitors.length;
    if (Math.random() < 0.05 && competitors.length >= 2) {
      this.triggerMerger(competitors, events);
    }
    for (const comp of competitors) {
      if (comp.intel.length > 200) {
        comp.intel = comp.intel.slice(-200);
      }
    }
    const bankrupted = [];
    const survivors = [];
    for (const comp of competitors) {
      if ((comp.bankruptDays ?? 0) >= BANKRUPT_THRESHOLD_DAYS) {
        bankrupted.push(comp);
      } else {
        survivors.push(comp);
      }
    }
    if (bankrupted.length > 0 && survivors.length < MIN_ACTIVE_COMPETITORS) {
      bankrupted.sort((a, b) => a.burnRate - b.burnRate);
      const needToRevive = MIN_ACTIVE_COMPETITORS - survivors.length;
      for (let i = 0; i < needToRevive && i < bankrupted.length; i++) {
        const comp = bankrupted[i];
        comp.bankruptDays = 0;
        comp.funds = comp.burnRate * 12;
        comp.intel.push({
          id: genId3(`intel-${comp.id}-${current2.date}-bailout`),
          competitorId: comp.id,
          type: "funding",
          title: `${comp.name} \u83B7\u5F97\u7D27\u6025\u6551\u52A9`,
          description: `\u901A\u8FC7\u79D8\u5BC6\u6E20\u9053\u83B7\u5F97\u7D27\u6025\u878D\u8D44\uFF0C\u907F\u514D\u7834\u4EA7`,
          day: current2.date,
          severity: "warning"
        });
        survivors.push(comp);
      }
      for (let i = needToRevive; i < bankrupted.length; i++) {
      }
    }
    const trulyBankrupted = bankrupted.filter((c) => !survivors.includes(c));
    for (const comp of trulyBankrupted) {
      events.emit("COMPETITOR_BANKRUPT", comp.name, current2.date);
    }
    state.update((draft) => {
      draft.competitorStates = survivors.map((c) => ({
        ...c,
        capabilities: { ...c.capabilities },
        operatingRegions: [...c.operatingRegions],
        regionQualityMultiplier: { ...c.regionQualityMultiplier },
        releasedModels: c.releasedModels.map((m) => ({ ...m })),
        intel: c.intel.map((i) => ({ ...i }))
      }));
    });
    updateCompetitorStates(survivors);
    const openSourceEvents = [];
    for (const comp of survivors) {
      if (comp.strategy !== "open_source") continue;
      const lastDay = current2.lastOpenSourceDay[comp.id] ?? -999;
      const cooldown = 30 + Math.floor(Math.random() * 31);
      if (current2.date - lastDay < cooldown) continue;
      const usePool = Math.random() < 0.6;
      let techId = "";
      let techName = "";
      let techDesc = "";
      if (usePool) {
        const available = OPEN_SOURCE_TECH_POOL.filter((t) => !IDEA_TECH_MAP[t.id]);
        if (available.length > 0) {
          const picked = available[Math.floor(Math.random() * available.length)];
          techId = picked.id;
          techName = picked.name;
          techDesc = picked.description;
        }
      }
      if (!techId) {
        const available = ALL_TECH.filter(
          (t) => (current2.techMaturity[t.id] ?? 0) < 1 && t.researchDays > 0
        );
        if (available.length > 0) {
          const picked = available[Math.floor(Math.random() * available.length)];
          techId = picked.id;
          techName = picked.name;
          techDesc = picked.description;
        }
      }
      if (!techId) continue;
      const adoptionCost = Math.round(5e4 + Math.random() * 15e4);
      const initialMaturity = 20 + Math.floor(Math.random() * 21);
      const offer = {
        id: genId3(`offer-${comp.id}-${current2.date}`),
        techId,
        techName,
        techDescription: techDesc,
        source: comp.name,
        publishedDay: current2.date,
        adoptionCost,
        initialMaturity,
        expiresDay: current2.date + 14
      };
      openSourceEvents.push({ compName: comp.name, offer });
    }
    if (openSourceEvents.length > 0) {
      state.update((draft) => {
        for (const { offer } of openSourceEvents) {
          draft.openSourceOffers.push(offer);
        }
        for (const { compName } of openSourceEvents) {
          const comp = survivors.find((c) => c.name === compName);
          if (comp) draft.lastOpenSourceDay[comp.id] = draft.date;
        }
      });
      for (const { compName, offer } of openSourceEvents) {
        events.emit("OPEN_SOURCE_PUBLISHED", { compName, offer });
      }
    }
  }
  simulateCompetitor(comp, day, events) {
    comp.releasedLastMonth = false;
    comp.funds -= comp.burnRate * (COMPETITOR_TICK_DAYS / 30);
    comp.funds = Math.max(0, comp.funds);
    if (comp.funds <= 0) {
      comp.bankruptDays = (comp.bankruptDays ?? 0) + COMPETITOR_TICK_DAYS;
    } else {
      comp.bankruptDays = 0;
    }
    if (comp.funds < comp.burnRate * 12) {
      const funder = FUNDING_EVENTS[Math.floor(Math.random() * FUNDING_EVENTS.length)];
      const amount = funder.amount[0] + Math.random() * (funder.amount[1] - funder.amount[0]);
      comp.funds += amount;
      const intel = {
        id: genId3(`intel-${comp.id}-${day}-funding`),
        competitorId: comp.id,
        type: "funding",
        title: `${comp.name} \u83B7\u5F97\u878D\u8D44`,
        description: `${funder.name} \u9886\u6295\uFF0C\u878D\u8D44\u91D1\u989D\u7EA6 $${amount.toFixed(0)}M`,
        day,
        severity: amount > 3e3 ? "critical" : amount > 1e3 ? "warning" : "info"
      };
      comp.intel.push(intel);
      if (comp.infiltrationLevel > 0) events.emit("COMPETITOR_INTEL", intel);
    }
    const progressScale = COMPETITOR_TICK_DAYS / 30;
    const computeFactor = Math.log10(comp.computeUnits + 1) / Math.log10(1e4);
    const researcherFactor = 1 + comp.coreResearchers / 200;
    const progressPerTick = 5 * computeFactor * researcherFactor * (0.8 + Math.random() * 0.4) * progressScale;
    comp.trainingProgress = Math.min(100, comp.trainingProgress + progressPerTick);
    if (Math.random() < 0.08 * progressScale) {
      const scandal = SCANDAL_EVENTS[Math.floor(Math.random() * SCANDAL_EVENTS.length)];
      comp.trainingProgress = Math.max(0, comp.trainingProgress - 10 * progressScale);
      comp.funds = Math.max(0, comp.funds - scandal.fundsLoss * progressScale);
      const intel = {
        id: genId3(`intel-${comp.id}-${day}-scandal`),
        competitorId: comp.id,
        type: "scandal",
        title: `${comp.name}: ${scandal.title}`,
        description: scandal.desc,
        day,
        severity: "warning"
      };
      comp.intel.push(intel);
      if (comp.infiltrationLevel > 0) events.emit("COMPETITOR_INTEL", intel);
    }
    if (comp.trainingProgress >= 100) {
      const improvement = 1.05 + Math.random() * 0.1;
      for (const capId of Object.keys(comp.capabilities)) {
        comp.capabilities[capId] = Math.min(2e3, comp.capabilities[capId] * improvement);
      }
      const newScore = Math.max(...Object.values(comp.capabilities));
      const modelName = `${comp.name}-${comp.releasedModels.length + 1}`;
      comp.releasedModels.push({
        name: modelName,
        paramCount: 70 + Math.floor(Math.random() * 400),
        baseScore: newScore,
        day
      });
      comp.trainingProgress = 0;
      comp.releasedLastMonth = true;
      const intel = {
        id: `intel-${comp.id}-${day}-release`,
        competitorId: comp.id,
        type: "release",
        title: `${comp.name} \u53D1\u5E03\u65B0\u6A21\u578B ${modelName}`,
        description: `\u80FD\u529B\u8BC4\u5206 ${newScore.toFixed(0)}\uFF0C\u7EA6 ${comp.releasedModels[comp.releasedModels.length - 1].paramCount}B \u53C2\u6570`,
        day,
        severity: newScore > 1500 ? "critical" : "warning"
      };
      comp.intel.push(intel);
      events.emit("COMPETITOR_RELEASE", modelName, newScore, day);
    }
    const growthScale = COMPETITOR_TICK_DAYS / 30;
    comp.computeUnits *= 1 + comp.growthRate * growthScale;
    comp.headcount = Math.floor(comp.headcount * (1 + comp.growthRate / 2 * growthScale));
    comp.coreResearchers = Math.floor(comp.coreResearchers * (1 + comp.growthRate * growthScale));
    if (comp.infiltrationLevel > 0 && Math.random() < 0.03) {
      comp.infiltrationLevel = Math.max(0, comp.infiltrationLevel - 1);
    }
  }
  /** 合并事件（操作传入的 competitors 数组） */
  triggerMerger(competitors, events) {
    const healthyCandidates = competitors.filter((c) => (c.bankruptDays ?? 0) === 0);
    if (healthyCandidates.length < 2) return;
    const idx1 = competitors.indexOf(healthyCandidates[Math.floor(Math.random() * healthyCandidates.length)]);
    let idx2;
    do {
      idx2 = Math.floor(Math.random() * competitors.length);
    } while (idx2 === idx1);
    const a = competitors[idx1];
    const b = competitors[idx2];
    const aAvgCap = Object.values(a.capabilities).reduce((s, v) => s + v, 0) / 16;
    const bAvgCap = Object.values(b.capabilities).reduce((s, v) => s + v, 0) / 16;
    let strongName;
    let weakName;
    if (aAvgCap > bAvgCap) {
      this.absorb(a, b, idx2, competitors);
      strongName = a.name;
      weakName = b.name;
    } else {
      this.absorb(b, a, idx1, competitors);
      strongName = b.name;
      weakName = a.name;
    }
    events.emit("COMPETITOR_MERGER", strongName, weakName);
  }
  absorb(strong, weak, weakIdx, competitors) {
    const weakHealth = (weak.bankruptDays ?? 0) > 0 ? 0.3 : 1;
    strong.funds += weak.funds * 0.7 * weakHealth;
    strong.computeUnits += weak.computeUnits * weakHealth;
    strong.headcount += Math.floor(weak.headcount * 0.6 * weakHealth);
    strong.coreResearchers += Math.floor(weak.coreResearchers * 0.5 * weakHealth);
    competitors.splice(weakIdx, 1);
  }
};

// ../../src/core/systems/SmallCompanyMarketSystem.ts
var REFRESH_DAYS = 14;
var SPAWN_MIN = 2;
var SPAWN_MAX = 3;
var LIFESPAN = 30;
var COMPANY_NAMES = [
  "Nexus AI",
  "DeepForge",
  "CogniLabs",
  "Synapse Co",
  "MindForge",
  "NeuroSpark",
  "LogicStream",
  "TensorWave",
  "CortexHub",
  "Atlas AI",
  "PrismMind",
  "QuantumLeaf",
  "EchoLabs",
  "Vertex AI",
  "LumenMind"
];
var BACKGROUNDS = [
  "\u4E13\u6CE8\u63A8\u7406\u4F18\u5316\u7684\u521D\u521B\u56E2\u961F",
  "\u62E5\u6709\u591A\u9879\u6CE8\u610F\u529B\u4E13\u5229\u7684\u7814\u7A76\u673A\u6784",
  "\u64C5\u957F\u6570\u636E\u5DE5\u7A0B\u7684\u7CBE\u7B80\u56E2\u961F",
  "\u4E13\u6CE8\u5BF9\u9F50\u5B89\u5168\u7684\u975E\u8425\u5229\u5B9E\u9A8C\u5BA4",
  "MoE \u67B6\u6784\u4E13\u5BB6",
  "\u957F\u4E0A\u4E0B\u6587\u5904\u7406\u5148\u950B"
];
function genId4(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
var SmallCompanyMarketSystem = class {
  name = "SmallCompanyMarketSystem";
  update(state, events, _deltaDays) {
    const current2 = state.read();
    const expiredIds = current2.smallCompanies.filter((c) => !c.acquired && current2.date - c.spawnedDay > c.lifespan).map((c) => c.id);
    const shouldRefresh = current2.date - current2.lastSmallCompanyRefreshDay >= REFRESH_DAYS;
    if (!shouldRefresh && expiredIds.length === 0) return;
    state.update((draft) => {
      if (expiredIds.length > 0) {
        draft.smallCompanies = draft.smallCompanies.filter((c) => !expiredIds.includes(c.id));
      }
      if (shouldRefresh) {
        const count = SPAWN_MIN + Math.floor(Math.random() * (SPAWN_MAX - SPAWN_MIN + 1));
        const usedNames = new Set(draft.smallCompanies.map((c) => c.name));
        const availableNames = COMPANY_NAMES.filter((n) => !usedNames.has(n));
        for (let i = 0; i < count && availableNames.length > 0; i++) {
          const nameIdx = Math.floor(Math.random() * availableNames.length);
          const name = availableNames.splice(nameIdx, 1)[0];
          const bg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
          const techCount = 1 + Math.floor(Math.random() * 3);
          const techs = [];
          for (let j = 0; j < techCount; j++) {
            const usePool = Math.random() < 0.5;
            if (usePool) {
              const available2 = SMALL_COMPANY_TECH_POOL.filter(
                (t) => !techs.includes(t.id) && !IDEA_TECH_MAP[t.id]
              );
              if (available2.length > 0) {
                techs.push(available2[Math.floor(Math.random() * available2.length)].id);
                continue;
              }
            }
            const available = ALL_TECH.filter(
              (t) => !techs.includes(t.id) && (draft.techMaturity[t.id] ?? 0) < 1 && t.researchDays > 0
            );
            if (available.length > 0) {
              techs.push(available[Math.floor(Math.random() * available.length)].id);
            }
          }
          if (techs.length === 0) continue;
          const techMaturities = {};
          let valuation = 2e5;
          for (const tid of techs) {
            const mat = 20 + Math.floor(Math.random() * 61);
            techMaturities[tid] = mat;
            valuation += 5e4 + mat * 5e3;
          }
          valuation = Math.round(valuation);
          draft.smallCompanies.push({
            id: genId4(`sc-${draft.date}-${i}`),
            name,
            technologies: techs,
            techMaturities,
            valuation,
            spawnedDay: draft.date,
            lifespan: LIFESPAN,
            acquired: false,
            background: bg
          });
        }
        draft.lastSmallCompanyRefreshDay = draft.date;
      }
    });
    if (shouldRefresh) {
      events.emit("SMALL_COMPANY_REFRESHED", current2.smallCompanies.length);
    }
  }
};

// ../../src/core/utils/uniqueTechSlots.ts
var SLOT_BASE = 4;
var SLOT_PER_RESEARCHERS = 3;
var SLOT_PER_DAYS = 365;
var MAINT_BASE = 50;
var MAINT_PER_MATURITY = 1;
function getMaxUniqueTechSlots(data) {
  const researcherCount = data.employees.filter(
    (e) => e.role === "researcher" /* RESEARCHER */
  ).length;
  const dayBonus = Math.floor(data.date / SLOT_PER_DAYS);
  const researcherBonus = Math.floor(researcherCount / SLOT_PER_RESEARCHERS);
  return SLOT_BASE + researcherBonus + dayBonus;
}
function getUniqueTechCount(data) {
  return data.acceptedIdeaTechs.length;
}
function canAcceptUniqueTechs(data, additionalCount = 1) {
  const current2 = getUniqueTechCount(data);
  const max = getMaxUniqueTechSlots(data);
  return current2 + additionalCount <= max;
}
function getSingleTechMaintenance(maturity) {
  return MAINT_BASE + MAINT_PER_MATURITY * Math.max(0, maturity);
}
function getTotalUniqueTechMaintenance(data) {
  let total = 0;
  for (const tech of data.acceptedIdeaTechs) {
    const maturity = data.techMaturity[tech.id] ?? 0;
    if (maturity >= 1) {
      total += getSingleTechMaintenance(maturity);
    }
  }
  return total;
}

// ../../src/core/systems/UniqueTechMaintenanceSystem.ts
var UniqueTechMaintenanceSystem = class {
  name = "UniqueTechMaintenanceSystem";
  update(state, events, deltaDays) {
    const current2 = state.read();
    const dailyCost = getTotalUniqueTechMaintenance(current2);
    if (dailyCost <= 0) return;
    const totalCost = dailyCost * deltaDays;
    const fundsBefore = current2.resources["funds"] ?? 0;
    const underfunded = fundsBefore < totalCost;
    state.update((draft) => {
      draft.resources["funds"] = Math.max(0, (draft.resources["funds"] ?? 0) - totalCost);
    });
    if (underfunded) {
      events.emit("UNIQUE_TECH_MAINT_UNDERFUNDED", {
        dailyCost,
        totalCost,
        fundsBefore,
        techCount: current2.acceptedIdeaTechs.length
      });
    }
  }
};

// ../../src/core/systems/PostTrainingSystem.ts
var POST_TRAINING_CONFIGS = {
  sft: {
    unlockTech: "sft",
    computeCoeff: 2,
    fundsCoeff: 10,
    requires: null,
    mutuallyExclusive: [],
    capacityGains: {
      dialogue_fluency: 0.15,
      instruction_following: 0.1
    }
  },
  rlhf: {
    unlockTech: "rlhf",
    computeCoeff: 5,
    fundsCoeff: 30,
    requires: "sft",
    mutuallyExclusive: ["dpo"],
    capacityGains: {
      sycophancy: -0.1,
      alignment: 0.3,
      honesty: 0.12
    }
  },
  dpo: {
    unlockTech: "dpo",
    computeCoeff: 3,
    fundsCoeff: 15,
    requires: "sft",
    mutuallyExclusive: ["rlhf"],
    capacityGains: {
      sycophancy: -0.08,
      alignment: 0.2,
      improve_utilization: 0.02
    }
  },
  cot: {
    unlockTech: "cot_training",
    computeCoeff: 4,
    fundsCoeff: 20,
    requires: "sft",
    mutuallyExclusive: [],
    capacityGains: {
      math_reasoning: 0.1,
      logical_reasoning: 0.08,
      coding: 0.05
    }
  }
};
var PostTrainingSystem = class {
  name = "PostTrainingSystem";
  update(state, events, deltaDays) {
    const current2 = state.read();
    const modelsWithPostTraining = current2.models.filter(
      (m) => m.postTraining && m.postTraining.some((pt) => pt.status === "in_progress" || pt.status === "pending")
    );
    if (modelsWithPostTraining.length === 0) return;
    const completedStages = [];
    state.update((draft) => {
      for (const model of draft.models) {
        if (!model.postTraining || model.postTraining.length === 0) continue;
        for (let i = 0; i < model.postTraining.length; i++) {
          const pt = model.postTraining[i];
          if (pt.status === "completed") continue;
          if (pt.status === "pending") {
            const config = POST_TRAINING_CONFIGS[pt.stage];
            const techMat = draft.techMaturity[config.unlockTech] ?? 0;
            if (techMat < 1) continue;
            if (config.mutuallyExclusive.length > 0) {
              const hasMutuallyExclusive = model.postTraining.some(
                (p) => config.mutuallyExclusive.includes(p.stage) && p.status === "completed"
              );
              if (hasMutuallyExclusive) {
                pt.status = "completed";
                pt.completedAt = draft.date;
                continue;
              }
            }
            const fundsCost = config.fundsCoeff * 1e3 * model.paramCount;
            const funds = draft.resources["funds"] ?? 0;
            if (funds < fundsCost) {
              events.emit("POST_TRAINING_REJECTED", {
                modelId: model.id,
                stage: pt.stage,
                reason: `\u8D44\u91D1\u4E0D\u8DB3\uFF0C\u9700\u8981 $${fundsCost.toLocaleString()}`
              });
              continue;
            }
            draft.resources["funds"] = Math.max(0, funds - fundsCost);
            pt.status = "in_progress";
            pt.startedAt = draft.date;
            events.emit("POST_TRAINING_STARTED", {
              modelId: model.id,
              modelName: model.name,
              stage: pt.stage,
              computeTotal: pt.computeTotal,
              fundsCost
            });
          }
          if (pt.status === "in_progress") {
            const dailyCompute = model.paramCount * 0.1 * deltaDays;
            pt.computeRemaining = Math.max(0, pt.computeRemaining - dailyCompute);
            if (pt.computeRemaining <= 0) {
              pt.status = "completed";
              pt.completedAt = draft.date;
              const config = POST_TRAINING_CONFIGS[pt.stage];
              const techMat = draft.techMaturity[config.unlockTech] ?? 0;
              const matScale = techMat / 100;
              for (const [capId, baseGain] of Object.entries(config.capacityGains)) {
                const scaledGain = baseGain * matScale;
                const currentCap = model.capabilities[capId] ?? 0;
                model.capabilities[capId] = currentCap + scaledGain;
              }
              completedStages.push({
                modelId: model.id,
                stage: pt.stage,
                modelName: model.name
              });
            }
          }
        }
      }
    });
    for (const c of completedStages) {
      events.emit("POST_TRAINING_COMPLETED", {
        modelId: c.modelId,
        modelName: c.modelName,
        stage: c.stage
      });
    }
  }
};

// ../../src/core/config/datasets.ts
var INITIAL_DATA_DOMAINS = {
  code: { tokens: 50, quality: 0.7, freshness: 0.8, duplication: 0.2 },
  math: { tokens: 20, quality: 0.8, freshness: 0.7, duplication: 0.1 },
  science: { tokens: 30, quality: 0.85, freshness: 0.6, duplication: 0.15 },
  web: { tokens: 200, quality: 0.5, freshness: 0.9, duplication: 0.4 },
  books: { tokens: 80, quality: 0.8, freshness: 0.3, duplication: 0.1 },
  dialogue: { tokens: 15, quality: 0.6, freshness: 0.85, duplication: 0.2 },
  multilingual: { tokens: 40, quality: 0.55, freshness: 0.7, duplication: 0.25 },
  multimodal: { tokens: 0, quality: 0, freshness: 0, duplication: 0 },
  user_feedback: { tokens: 0, quality: 0, freshness: 0, duplication: 0 },
  rl_data: { tokens: 0, quality: 0, freshness: 0, duplication: 0 },
  synthetic: { tokens: 0, quality: 0, freshness: 0, duplication: 0 }
};
function createInitialDataset() {
  const domains = {};
  Object.keys(INITIAL_DATA_DOMAINS).forEach((id) => {
    domains[id] = { id, ...INITIAL_DATA_DOMAINS[id] };
  });
  const totalTokens = Object.values(domains).reduce((s, d) => s + d.tokens, 0);
  const effectiveTokens = Object.values(domains).reduce(
    (s, d) => s + d.tokens * d.quality * (1 - d.duplication),
    0
  );
  return {
    id: "dataset-initial",
    name: "\u521D\u59CB\u516C\u5F00\u6570\u636E\u96C6",
    domains,
    totalTokens,
    effectiveTokens,
    contamination: 0.05,
    legality: 1,
    createdAt: 0
  };
}

// ../../src/core/entities/Department.ts
var DEPARTMENT_NAMES = {
  research: "\u7814\u53D1\u90E8",
  data: "\u6570\u636E\u90E8",
  infrastructure: "\u57FA\u7840\u8BBE\u65BD\u90E8",
  product: "\u4EA7\u54C1\u90E8",
  legal_pr: "\u6CD5\u52A1\u516C\u5173\u90E8"
};
var DEPARTMENT_ROLE_MAP = {
  research: "researcher" /* RESEARCHER */,
  data: "data_engineer" /* DATA_ENGINEER */,
  infrastructure: "system_engineer" /* SYSTEM_ENGINEER */,
  product: "product_manager" /* PRODUCT_MANAGER */,
  legal_pr: "legal_pr" /* LEGAL_PR */
};
var DEPT_HEAD_MIN_LEVEL = 7;

// ../../src/core/commands/AddResourceCommand.ts
var AddResourceCommand = class {
  constructor(resourceId, amount, reason) {
    this.resourceId = resourceId;
    this.amount = amount;
    this.reason = reason;
  }
  execute(state, events) {
    state.addResource(this.resourceId, this.amount);
    events.emit("RESOURCE_CHANGED", this.resourceId, this.amount, this.reason);
  }
};

// ../../src/core/commands/AdjustSalaryCommand.ts
var AdjustSalaryCommand = class {
  constructor(employeeId, newSalary) {
    this.employeeId = employeeId;
    this.newSalary = newSalary;
  }
  execute(state, events) {
    if (this.newSalary < 0) {
      events.emit("SALARY_ADJUST_REJECTED", { employeeId: this.employeeId, reason: "\u85AA\u8D44\u4E0D\u80FD\u4E3A\u8D1F" });
      return;
    }
    const current2 = state.read();
    const emp = current2.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit("SALARY_ADJUST_REJECTED", { employeeId: this.employeeId, reason: "\u5458\u5DE5\u4E0D\u5B58\u5728" });
      return;
    }
    const oldSalary = emp.salary;
    const delta = this.newSalary - oldSalary;
    let loyaltyDelta = 0;
    if (delta > 0) {
      loyaltyDelta = clamp(delta / oldSalary * 30, 0, 15);
    } else if (delta < 0) {
      loyaltyDelta = clamp(delta / oldSalary * 60, -30, 0);
    }
    state.update((draft) => {
      const target = draft.employees.find((e) => e.id === this.employeeId);
      if (target) {
        target.salary = this.newSalary;
        target.loyalty = clamp(target.loyalty + loyaltyDelta, 0, 100);
      }
    });
    events.emit("SALARY_ADJUSTED", {
      employeeId: this.employeeId,
      oldSalary,
      newSalary: this.newSalary,
      loyaltyDelta
    });
  }
};

// ../../src/core/commands/AssignEmployeeCommand.ts
var AssignEmployeeCommand = class {
  constructor(employeeId, projectId) {
    this.employeeId = employeeId;
    this.projectId = projectId;
  }
  execute(state, events) {
    const current2 = state.read();
    const emp = current2.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit("ASSIGN_FAILED", { employeeId: this.employeeId, reason: "\u5458\u5DE5\u4E0D\u5B58\u5728" });
      return;
    }
    if (emp.status === "training" && this.projectId !== null) {
      events.emit("ASSIGN_FAILED", {
        employeeId: this.employeeId,
        reason: "\u5458\u5DE5\u6B63\u5728\u57F9\u8BAD\u4E2D\uFF0C\u65E0\u6CD5\u5206\u914D\u5230\u9879\u76EE"
      });
      return;
    }
    state.update((draft) => {
      const target = draft.employees.find((e) => e.id === this.employeeId);
      if (!target) return;
      if (this.projectId === null) {
        target.status = "idle";
        target.assignedProjectId = void 0;
      } else {
        target.status = "assigned";
        target.assignedProjectId = this.projectId;
      }
    });
    if (this.projectId === null) {
      events.emit("EMPLOYEE_UNASSIGNED", this.employeeId);
    } else {
      events.emit("EMPLOYEE_ASSIGNED", this.employeeId, this.projectId);
    }
  }
};

// ../../src/core/commands/BuildPowerPlantCommand.ts
var BuildPowerPlantCommand = class {
  constructor(capacityKW) {
    this.capacityKW = capacityKW;
  }
  execute(state, events) {
    if (this.capacityKW <= 0) {
      events.emit("POWER_PLANT_REJECTED", { reason: "\u5BB9\u91CF\u5FC5\u987B\u5927\u4E8E 0" });
      return;
    }
    const cost = this.capacityKW * POWER_CONFIG.powerPlantCostPerKW;
    const funds = state.getResource("funds");
    if (funds < cost) {
      events.emit("POWER_PLANT_REJECTED", {
        capacityKW: this.capacityKW,
        cost,
        funds,
        reason: "\u8D44\u91D1\u4E0D\u8DB3"
      });
      return;
    }
    state.addResource("funds", -cost);
    state.addResource("power_kw", this.capacityKW);
    const today = state.read().date;
    const rawPlants = state.getResourceMeta("power_plants");
    const plants = Array.isArray(rawPlants) ? rawPlants : [];
    const newPlant = {
      id: `plant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      capacityKW: this.capacityKW,
      builtAt: today,
      cost
    };
    state.setResource("power_plants", plants.length + 1, [...plants, newPlant]);
    events.emit("POWER_PLANT_BUILT", newPlant);
  }
};

// ../../src/core/commands/DataCommands.ts
function genId5(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
var AcquireDataCommand = class {
  constructor(routeId, targetDatasetId) {
    this.routeId = routeId;
    this.targetDatasetId = targetDatasetId;
  }
  execute(state, events) {
    const route = PURCHASE_MAP[this.routeId];
    if (!route) {
      events.emit("DATA_ACQUIRE_REJECTED", { reason: "\u672A\u77E5\u6570\u636E\u83B7\u53D6\u8DEF\u7EBF" });
      return;
    }
    const current2 = state.read();
    const dataset = current2.datasets.find((d) => d.id === this.targetDatasetId);
    if (!dataset) {
      events.emit("DATA_ACQUIRE_REJECTED", { reason: "\u76EE\u6807\u6570\u636E\u96C6\u4E0D\u5B58\u5728" });
      return;
    }
    if (route.requiredTech && !isTechUnlocked(current2, route.requiredTech)) {
      events.emit("DATA_ACQUIRE_REJECTED", { reason: `\u9700\u8981\u6280\u672F\uFF1A${route.requiredTech}` });
      return;
    }
    const funds = current2.resources["funds"] ?? 0;
    if (funds < route.cost) {
      events.emit("DATA_ACQUIRE_REJECTED", { reason: "\u8D44\u91D1\u4E0D\u8DB3", cost: route.cost });
      return;
    }
    const lastUsed = current2.dataAcquisitionCooldowns[this.routeId] ?? -999;
    if (current2.date - lastUsed < route.cooldownDays) {
      const remaining = route.cooldownDays - (current2.date - lastUsed);
      events.emit("DATA_ACQUIRE_REJECTED", { reason: `\u51B7\u5374\u4E2D\uFF0C\u5269\u4F59 ${remaining} \u5929` });
      return;
    }
    const techEffects = getActiveTechEffects(current2);
    const dataQualityBonus = aggregateMultiplicative(
      techEffects,
      "improve_data_quality",
      TECH_EFFECT_CAPS.improve_data_quality
    );
    const effectiveQuality = Math.min(1, route.quality + dataQualityBonus);
    state.update((draft) => {
      draft.resources["funds"] -= route.cost;
      draft.dataAcquisitionCooldowns[this.routeId] = draft.date;
      const ds = draft.datasets.find((d) => d.id === this.targetDatasetId);
      if (ds) {
        for (const domainId of route.targetDomains) {
          const domain = ds.domains[domainId];
          if (domain) {
            const oldWeight = domain.tokens;
            domain.tokens += route.tokensProduced;
            domain.quality = (domain.quality * oldWeight + effectiveQuality * route.tokensProduced) / domain.tokens;
          }
        }
        ds.totalTokens = Object.values(ds.domains).reduce((s, d) => s + d.tokens, 0);
        ds.effectiveTokens = Object.values(ds.domains).reduce(
          (s, d) => s + d.tokens * d.quality * (1 - d.duplication),
          0
        );
      }
      if (route.isGrey) {
        draft.riskState.legalDebt = Math.min(100, draft.riskState.legalDebt + route.legalDebtIncrement);
        draft.riskState.trustDebt = Math.min(100, draft.riskState.trustDebt + route.trustDebtIncrement);
        draft.riskState.employeeMorale = Math.max(0, draft.riskState.employeeMorale - route.moraleLoss);
      }
    });
    events.emit("DATA_ACQUIRED", {
      route: route.name,
      tokens: route.tokensProduced,
      isGrey: route.isGrey
    });
  }
};
var SynthesizeDataCommand = class {
  constructor(sourceModelId, targetDomain, amount, targetDatasetId) {
    this.sourceModelId = sourceModelId;
    this.targetDomain = targetDomain;
    this.amount = amount;
    this.targetDatasetId = targetDatasetId;
  }
  execute(state, events) {
    const current2 = state.read();
    const model = current2.models.find((m) => m.id === this.sourceModelId);
    if (!model) {
      events.emit("DATA_SYNTH_REJECTED", { reason: "\u6E90\u6A21\u578B\u4E0D\u5B58\u5728" });
      return;
    }
    if (!isTechUnlocked(current2, "distillation")) {
      events.emit("DATA_SYNTH_REJECTED", { reason: "\u9700\u8981\u84B8\u998F\u6280\u672F" });
      return;
    }
    state.update((draft) => {
      const ds = draft.datasets.find((d) => d.id === this.targetDatasetId);
      if (!ds) return;
      const domain = ds.domains[this.targetDomain];
      if (!domain) return;
      const relevantCaps = CAPABILITIES.filter((c) => c.primaryDataDomains.includes(this.targetDomain)).map((c) => model.capabilities[c.id]);
      const avgCap = relevantCaps.length > 0 ? relevantCaps.reduce((s, v) => s + v, 0) / relevantCaps.length : 0;
      const quality = Math.min(0.95, 0.3 + avgCap / 2e3);
      const oldWeight = domain.tokens;
      domain.tokens += this.amount;
      domain.quality = (domain.quality * oldWeight + quality * this.amount) / domain.tokens;
      ds.totalTokens = Object.values(ds.domains).reduce((s, d) => s + d.tokens, 0);
      ds.effectiveTokens = Object.values(ds.domains).reduce(
        (s, d) => s + d.tokens * d.quality * (1 - d.duplication),
        0
      );
    });
    events.emit("DATA_SYNTHESIZED", { amount: this.amount, domain: this.targetDomain });
  }
};
var StartExperimentCommand = class {
  constructor(targetArchId, researcherIds, experimentParams, computeRatio, repeatMode = "once", queueItemId = null) {
    this.targetArchId = targetArchId;
    this.researcherIds = researcherIds;
    this.experimentParams = experimentParams;
    this.computeRatio = computeRatio;
    this.repeatMode = repeatMode;
    this.queueItemId = queueItemId;
  }
  execute(state, events) {
    const current2 = state.read();
    const activeCount = current2.researchProjects.filter((p) => p.status === "in_progress").length;
    if (activeCount >= RESEARCH_CONFIG.maxConcurrentProjects) {
      events.emit("EXPERIMENT_REJECTED", { reason: "\u5E76\u53D1\u7814\u53D1\u9879\u76EE\u5DF2\u8FBE\u4E0A\u9650" });
      return;
    }
    for (const empId of this.researcherIds) {
      const emp = current2.employees.find((e) => e.id === empId);
      if (!emp) {
        events.emit("EXPERIMENT_REJECTED", { reason: `\u5458\u5DE5 ${empId} \u4E0D\u5B58\u5728` });
        return;
      }
      if (emp.role !== "researcher" /* RESEARCHER */) {
        events.emit("EXPERIMENT_REJECTED", { reason: `${emp.name} \u4E0D\u662F\u7814\u7A76\u5458` });
        return;
      }
      if (emp.status === "assigned") {
        events.emit("EXPERIMENT_REJECTED", { reason: `\u5458\u5DE5 ${emp.name} \u5DF2\u88AB\u5206\u914D` });
        return;
      }
    }
    const params = this.experimentParams;
    const ratio = this.computeRatio;
    if (params < EXPERIMENT_CONFIG.paramOptions[0] || params > EXPERIMENT_CONFIG.paramOptions[EXPERIMENT_CONFIG.paramOptions.length - 1]) {
      events.emit("EXPERIMENT_REJECTED", { reason: `\u53C2\u6570\u91CF\u5FC5\u987B\u5728 ${EXPERIMENT_CONFIG.paramOptions[0]}~${EXPERIMENT_CONFIG.paramOptions[EXPERIMENT_CONFIG.paramOptions.length - 1]}B \u4E4B\u95F4` });
      return;
    }
    if (ratio < EXPERIMENT_CONFIG.minComputeRatio || ratio > EXPERIMENT_CONFIG.maxComputeRatio) {
      events.emit("EXPERIMENT_REJECTED", { reason: `\u7B97\u529B\u6BD4\u4F8B\u5FC5\u987B\u5728 ${(EXPERIMENT_CONFIG.minComputeRatio * 100).toFixed(1)}%~${(EXPERIMENT_CONFIG.maxComputeRatio * 100).toFixed(0)}% \u4E4B\u95F4` });
      return;
    }
    const totalExperimentRatio = current2.researchProjects.filter((p) => p.status === "in_progress" && p.computeRatio !== null).reduce((s, p) => s + (p.computeRatio ?? 0), 0);
    if (totalExperimentRatio + ratio > 0.95) {
      events.emit("EXPERIMENT_REJECTED", {
        reason: `\u5B9E\u9A8C\u7B97\u529B\u5360\u6BD4\u5C06\u8FBE ${((totalExperimentRatio + ratio) * 100).toFixed(0)}%\uFF0C\u8D85\u8FC7 95% \u4E0A\u9650`,
        currentRatio: totalExperimentRatio
      });
      return;
    }
    const computeBudgetTotal = calcExperimentBudget(params);
    const fundsCost = calcExperimentFundsCost(params);
    const funds = current2.resources["funds"] ?? 0;
    if (funds < fundsCost) {
      events.emit("EXPERIMENT_REJECTED", { reason: "\u8D44\u91D1\u4E0D\u8DB3", cost: fundsCost });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] = Math.max(0, (draft.resources["funds"] ?? 0) - fundsCost);
      const projectId = genId5("research");
      draft.researchProjects.push({
        id: projectId,
        type: "experiment_validation",
        status: "in_progress",
        targetArchId: this.targetArchId,
        researcherIds: [...this.researcherIds],
        // PR-B：旧字段保留兼容（computeBudget 存总算力预算，experimentScale 留 null）
        computeBudget: computeBudgetTotal,
        computeUsed: 0,
        progress: 0,
        startedAt: draft.date,
        completedAt: null,
        experimentResult: null,
        experimentScale: null,
        // PR-B 新字段
        experimentParams: params,
        computeRatio: ratio,
        computeBudgetTotal,
        // 队列扩展字段
        repeatMode: this.repeatMode,
        queueItemId: this.queueItemId
      });
      for (const empId of this.researcherIds) {
        const emp = draft.employees.find((e) => e.id === empId);
        if (emp) {
          emp.status = "assigned";
          emp.assignedProjectId = projectId;
        }
      }
    });
    events.emit("EXPERIMENT_STARTED", {
      archId: this.targetArchId,
      params,
      computeRatio: ratio,
      cost: fundsCost,
      budget: computeBudgetTotal
    });
  }
};
var CancelResearchProjectCommand = class {
  constructor(projectId) {
    this.projectId = projectId;
  }
  execute(state, events) {
    const current2 = state.read();
    const project = current2.researchProjects.find((p) => p.id === this.projectId);
    if (!project) {
      events.emit("RESEARCH_CANCEL_REJECTED", { reason: "\u9879\u76EE\u4E0D\u5B58\u5728" });
      return;
    }
    state.update((draft) => {
      for (const empId of project.researcherIds) {
        const emp = draft.employees.find((e) => e.id === empId);
        if (emp) {
          emp.status = "idle";
          emp.assignedProjectId = void 0;
        }
      }
      draft.researchProjects = draft.researchProjects.filter((p) => p.id !== this.projectId);
    });
    events.emit("RESEARCH_PROJECT_CANCELLED", this.projectId);
  }
};
var QueueExperimentCommand = class {
  constructor(techId, researcherIds, experimentParams, computeRatio, repeatMode) {
    this.techId = techId;
    this.researcherIds = researcherIds;
    this.experimentParams = experimentParams;
    this.computeRatio = computeRatio;
    this.repeatMode = repeatMode;
  }
  execute(state, events) {
    const current2 = state.read();
    const params = this.experimentParams;
    const ratio = this.computeRatio;
    if (params < EXPERIMENT_CONFIG.paramOptions[0] || params > EXPERIMENT_CONFIG.paramOptions[EXPERIMENT_CONFIG.paramOptions.length - 1]) {
      events.emit("EXPERIMENT_QUEUE_REJECTED", { reason: `\u53C2\u6570\u91CF\u5FC5\u987B\u5728 ${EXPERIMENT_CONFIG.paramOptions[0]}~${EXPERIMENT_CONFIG.paramOptions[EXPERIMENT_CONFIG.paramOptions.length - 1]}B \u4E4B\u95F4` });
      return;
    }
    if (ratio < EXPERIMENT_CONFIG.minComputeRatio || ratio > EXPERIMENT_CONFIG.maxComputeRatio) {
      events.emit("EXPERIMENT_QUEUE_REJECTED", { reason: `\u7B97\u529B\u6BD4\u4F8B\u5FC5\u987B\u5728 ${(EXPERIMENT_CONFIG.minComputeRatio * 100).toFixed(1)}%~${(EXPERIMENT_CONFIG.maxComputeRatio * 100).toFixed(0)}% \u4E4B\u95F4` });
      return;
    }
    for (const empId of this.researcherIds) {
      const emp = current2.employees.find((e) => e.id === empId);
      if (!emp || emp.role !== "researcher" /* RESEARCHER */) {
        events.emit("EXPERIMENT_QUEUE_REJECTED", { reason: `\u5458\u5DE5 ${empId} \u4E0D\u662F\u6709\u6548\u7814\u7A76\u5458` });
        return;
      }
    }
    const totalExperimentRatio = current2.researchProjects.filter((p) => p.status === "in_progress" && p.computeRatio !== null).reduce((s, p) => s + (p.computeRatio ?? 0), 0);
    if (totalExperimentRatio + ratio > 0.95) {
      events.emit("EXPERIMENT_QUEUE_REJECTED", {
        reason: `\u5F53\u524D\u5B9E\u9A8C\u7B97\u529B\u5360\u6BD4 ${(totalExperimentRatio * 100).toFixed(0)}% + \u672C\u9879 ${ratio * 100}% \u5C06\u8D85\u8FC7 95% \u4E0A\u9650`
      });
      return;
    }
    state.update((draft) => {
      draft.experimentQueue.push({
        id: genId5("expq"),
        techId: this.techId,
        experimentParams: params,
        computeRatio: ratio,
        researcherIds: [...this.researcherIds],
        repeatMode: this.repeatMode,
        queuedAt: draft.date
      });
    });
    events.emit("EXPERIMENT_QUEUED", { techId: this.techId, repeatMode: this.repeatMode });
  }
};
var RemoveQueuedExperimentCommand = class {
  constructor(queueItemId) {
    this.queueItemId = queueItemId;
  }
  execute(state, events) {
    state.update((draft) => {
      draft.experimentQueue = draft.experimentQueue.filter((q) => q.id !== this.queueItemId);
    });
    events.emit("EXPERIMENT_QUEUE_REMOVED", this.queueItemId);
  }
};
var ClearExperimentQueueCommand = class {
  execute(state, events) {
    state.update((draft) => {
      draft.experimentQueue = [];
    });
    events.emit("EXPERIMENT_QUEUE_CLEARED", {});
  }
};
var StartDataCollectionCommand = class {
  constructor(routeId, coreEngineerIds, normalEngineerCount, targetDatasetId) {
    this.routeId = routeId;
    this.coreEngineerIds = coreEngineerIds;
    this.normalEngineerCount = normalEngineerCount;
    this.targetDatasetId = targetDatasetId;
  }
  execute(state, events) {
    const route = COLLECTION_MAP[this.routeId];
    if (!route) {
      events.emit("DATA_COLLECTION_REJECTED", { reason: "\u672A\u77E5\u6536\u96C6\u8DEF\u7EBF" });
      return;
    }
    const current2 = state.read();
    if (route.requiredTech && !isTechUnlocked(current2, route.requiredTech)) {
      events.emit("DATA_COLLECTION_REJECTED", { reason: `\u9700\u8981\u6280\u672F\uFF1A${route.requiredTech}` });
      return;
    }
    const dataset = current2.datasets.find((d) => d.id === this.targetDatasetId);
    if (!dataset) {
      events.emit("DATA_COLLECTION_REJECTED", { reason: "\u76EE\u6807\u6570\u636E\u96C6\u4E0D\u5B58\u5728" });
      return;
    }
    for (const empId of this.coreEngineerIds) {
      const emp = current2.employees.find((e) => e.id === empId);
      if (!emp) {
        events.emit("DATA_COLLECTION_REJECTED", { reason: `\u5458\u5DE5 ${empId} \u4E0D\u5B58\u5728` });
        return;
      }
      if (emp.role !== "data_engineer" /* DATA_ENGINEER */) {
        events.emit("DATA_COLLECTION_REJECTED", { reason: `${emp.name} \u4E0D\u662F\u6570\u636E\u5DE5\u7A0B\u5E08` });
        return;
      }
      if (emp.status === "assigned") {
        events.emit("DATA_COLLECTION_REJECTED", { reason: `\u5458\u5DE5 ${emp.name} \u5DF2\u88AB\u5206\u914D` });
        return;
      }
    }
    const normalStaffId = ROLE_TO_STAFF_RESOURCE["data_engineer" /* DATA_ENGINEER */];
    const availableNormal = current2.resources[normalStaffId] ?? 0;
    if (this.normalEngineerCount > availableNormal) {
      events.emit("DATA_COLLECTION_REJECTED", {
        reason: `\u666E\u901A\u6570\u636E\u5DE5\u7A0B\u5E08\u4E0D\u8DB3\uFF1A\u9700\u8981 ${this.normalEngineerCount}\uFF0C\u53EF\u7528 ${availableNormal}`
      });
      return;
    }
    if (this.coreEngineerIds.length === 0 && this.normalEngineerCount === 0) {
      events.emit("DATA_COLLECTION_REJECTED", { reason: "\u672A\u5206\u914D\u4EFB\u4F55\u5DE5\u7A0B\u5E08" });
      return;
    }
    const dailyRate = calcCollectionRate(
      this.normalEngineerCount,
      this.coreEngineerIds.length,
      route
    );
    const currentQuality = calcCollectionQuality(this.coreEngineerIds.length, route);
    state.update((draft) => {
      const projectId = genId5("collection");
      const project = {
        id: projectId,
        routeId: this.routeId,
        engineerIds: [...this.coreEngineerIds],
        targetDatasetId: this.targetDatasetId,
        startedAt: draft.date,
        collectedTokens: 0,
        status: "active",
        dailyRate,
        currentQuality,
        // 设计-4：直接存储普通工程师数，停止时无需反推
        normalEngineerCount: this.normalEngineerCount
      };
      draft.dataCollectionProjects.push(project);
      for (const empId of this.coreEngineerIds) {
        const emp = draft.employees.find((e) => e.id === empId);
        if (emp) {
          emp.status = "assigned";
          emp.assignedProjectId = projectId;
        }
      }
      draft.resources[normalStaffId] -= this.normalEngineerCount;
    });
    events.emit("DATA_COLLECTION_STARTED", {
      routeId: this.routeId,
      coreEngineerCount: this.coreEngineerIds.length,
      normalEngineerCount: this.normalEngineerCount,
      dailyRate,
      quality: currentQuality,
      targetDatasetId: this.targetDatasetId
    });
  }
};
var StopDataCollectionCommand = class {
  constructor(projectId) {
    this.projectId = projectId;
  }
  execute(state, events) {
    const current2 = state.read();
    const project = current2.dataCollectionProjects.find((p) => p.id === this.projectId);
    if (!project) {
      events.emit("DATA_COLLECTION_STOP_REJECTED", { reason: "\u6536\u96C6\u9879\u76EE\u4E0D\u5B58\u5728" });
      return;
    }
    const normalCount = project.normalEngineerCount ?? 0;
    state.update((draft) => {
      const proj = draft.dataCollectionProjects.find((p) => p.id === this.projectId);
      if (proj) {
        proj.status = "stopped";
        for (const empId of proj.engineerIds) {
          const emp = draft.employees.find((e) => e.id === empId);
          if (emp) {
            emp.status = "idle";
            emp.assignedProjectId = void 0;
          }
        }
      }
      if (normalCount > 0) {
        const staffId = ROLE_TO_STAFF_RESOURCE["data_engineer" /* DATA_ENGINEER */];
        draft.resources[staffId] = (draft.resources[staffId] ?? 0) + normalCount;
      }
    });
    events.emit("DATA_COLLECTION_STOPPED", { projectId: this.projectId });
  }
};
var CreateDatasetCommand = class {
  constructor(name) {
    this.name = name;
  }
  execute(state, events) {
    const name = this.name.trim();
    if (!name) {
      events.emit("DATASET_CREATE_REJECTED", { reason: "\u6570\u636E\u96C6\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A" });
      return;
    }
    const current2 = state.read();
    if (current2.datasets.some((d) => d.name === name)) {
      events.emit("DATASET_CREATE_REJECTED", { reason: "\u6570\u636E\u96C6\u540D\u79F0\u5DF2\u5B58\u5728" });
      return;
    }
    const domains = {};
    Object.keys(INITIAL_DATA_DOMAINS).forEach((id) => {
      domains[id] = { id, tokens: 0, quality: 0, freshness: 0, duplication: 0 };
    });
    const dataset = {
      id: genId5("dataset"),
      name,
      domains,
      totalTokens: 0,
      effectiveTokens: 0,
      contamination: 0,
      legality: 1,
      createdAt: current2.date
    };
    state.update((draft) => {
      draft.datasets.push(dataset);
    });
    events.emit("DATASET_CREATED", { id: dataset.id, name });
  }
};
var DeleteDatasetCommand = class {
  constructor(datasetId) {
    this.datasetId = datasetId;
  }
  execute(state, events) {
    const current2 = state.read();
    const dataset = current2.datasets.find((d) => d.id === this.datasetId);
    if (!dataset) {
      events.emit("DATASET_DELETE_REJECTED", { reason: "\u6570\u636E\u96C6\u4E0D\u5B58\u5728" });
      return;
    }
    if (dataset.id === "dataset-initial") {
      events.emit("DATASET_DELETE_REJECTED", { reason: "\u521D\u59CB\u6570\u636E\u96C6\u4E0D\u53EF\u5220\u9664" });
      return;
    }
    const hasActiveCollection = current2.dataCollectionProjects.some(
      (p) => p.targetDatasetId === this.datasetId && p.status === "active"
    );
    if (hasActiveCollection) {
      events.emit("DATASET_DELETE_REJECTED", { reason: "\u6709\u8FDB\u884C\u4E2D\u7684\u6536\u96C6\u9879\u76EE\u5F15\u7528\u6B64\u6570\u636E\u96C6" });
      return;
    }
    state.update((draft) => {
      draft.datasets = draft.datasets.filter((d) => d.id !== this.datasetId);
    });
    events.emit("DATASET_DELETED", { id: this.datasetId });
  }
};

// ../../src/core/commands/DataOperationCommands.ts
var PURGE_COOLDOWN = 30;
var DEDUP_COOLDOWN = 60;
var CURATE_COOLDOWN = 45;
var PurgeDatasetCommand = class {
  constructor(datasetId, domainId) {
    this.datasetId = datasetId;
    this.domainId = domainId;
  }
  execute(state, events) {
    const current2 = state.read();
    const purgeMat = current2.techMaturity["data_cleaning_v1"] ?? 0;
    if (purgeMat < 1) {
      events.emit("DATA_PURGE_REJECTED", { reason: "\u672A\u89E3\u9501\u6570\u636E\u6E05\u6D17\u6280\u672F" });
      return;
    }
    const dataset = current2.datasets.find((d) => d.id === this.datasetId);
    if (!dataset) {
      events.emit("DATA_PURGE_REJECTED", { reason: "\u6570\u636E\u96C6\u4E0D\u5B58\u5728" });
      return;
    }
    const domain = dataset.domains[this.domainId];
    if (!domain) {
      events.emit("DATA_PURGE_REJECTED", { reason: `\u9886\u57DF ${this.domainId} \u4E0D\u5B58\u5728` });
      return;
    }
    if (domain.tokens <= 0) {
      events.emit("DATA_PURGE_REJECTED", { reason: "\u8BE5\u9886\u57DF\u65E0\u6570\u636E\u53EF\u6E05\u6D17" });
      return;
    }
    const cooldowns = current2.dataAcquisitionCooldowns ?? {};
    const lastPurge = cooldowns["purge_" + this.datasetId] ?? -999;
    if (current2.date - lastPurge < PURGE_COOLDOWN) {
      events.emit("DATA_PURGE_REJECTED", {
        reason: `\u51B7\u5374\u4E2D\uFF0C\u5269\u4F59 ${PURGE_COOLDOWN - (current2.date - lastPurge)} \u5929`
      });
      return;
    }
    const matScale = purgeMat / 100;
    const purgeRatio = 0.15 * matScale;
    const removedTokens = domain.tokens * purgeRatio;
    const qualityGain = (1 - domain.quality) * 0.1 * matScale;
    const cost = Math.ceil(5 * (removedTokens / 1e3));
    const funds = current2.resources["funds"] ?? 0;
    if (funds < cost) {
      events.emit("DATA_PURGE_REJECTED", { reason: `\u8D44\u91D1\u4E0D\u8DB3\uFF0C\u9700\u8981 $${cost.toLocaleString()}` });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] = Math.max(0, (draft.resources["funds"] ?? 0) - cost);
      if (!draft.dataAcquisitionCooldowns) draft.dataAcquisitionCooldowns = {};
      draft.dataAcquisitionCooldowns["purge_" + this.datasetId] = draft.date;
      const ds = draft.datasets.find((d) => d.id === this.datasetId);
      if (!ds) return;
      const dm = ds.domains[this.domainId];
      if (!dm) return;
      const removed = dm.tokens * purgeRatio;
      dm.tokens = Math.max(0, dm.tokens - removed);
      dm.quality = Math.min(1, dm.quality + qualityGain);
      ds.totalTokens = Object.values(ds.domains).reduce((s, d) => s + d.tokens, 0);
      ds.effectiveTokens = Object.values(ds.domains).reduce(
        (s, d) => s + d.tokens * d.quality * (1 - d.duplication),
        0
      );
    });
    events.emit("DATA_PURGED", {
      datasetId: this.datasetId,
      domainId: this.domainId,
      removedTokens: Math.ceil(removedTokens * 1e3) / 1e3,
      // GB
      qualityGain: Number(qualityGain.toFixed(3)),
      cost
    });
  }
};
var DedupDatasetCommand = class {
  constructor(datasetId) {
    this.datasetId = datasetId;
  }
  execute(state, events) {
    const current2 = state.read();
    const dedupMat = current2.techMaturity["data_deduplication"] ?? 0;
    if (dedupMat < 1) {
      events.emit("DATA_DEDUP_REJECTED", { reason: "\u672A\u89E3\u9501\u6570\u636E\u53BB\u91CD\u6280\u672F" });
      return;
    }
    const dataset = current2.datasets.find((d) => d.id === this.datasetId);
    if (!dataset) {
      events.emit("DATA_DEDUP_REJECTED", { reason: "\u6570\u636E\u96C6\u4E0D\u5B58\u5728" });
      return;
    }
    if (dataset.totalTokens <= 0) {
      events.emit("DATA_DEDUP_REJECTED", { reason: "\u6570\u636E\u96C6\u4E3A\u7A7A" });
      return;
    }
    const cooldowns = current2.dataAcquisitionCooldowns ?? {};
    const lastDedup = cooldowns["dedup_" + this.datasetId] ?? -999;
    if (current2.date - lastDedup < DEDUP_COOLDOWN) {
      events.emit("DATA_DEDUP_REJECTED", {
        reason: `\u51B7\u5374\u4E2D\uFF0C\u5269\u4F59 ${DEDUP_COOLDOWN - (current2.date - lastDedup)} \u5929`
      });
      return;
    }
    const matScale = dedupMat / 100;
    const totalTokensM = dataset.totalTokens * 1e3;
    const cost = Math.ceil(2 * totalTokensM);
    const funds = current2.resources["funds"] ?? 0;
    if (funds < cost) {
      events.emit("DATA_DEDUP_REJECTED", { reason: `\u8D44\u91D1\u4E0D\u8DB3\uFF0C\u9700\u8981 $${cost.toLocaleString()}` });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] = Math.max(0, (draft.resources["funds"] ?? 0) - cost);
      if (!draft.dataAcquisitionCooldowns) draft.dataAcquisitionCooldowns = {};
      draft.dataAcquisitionCooldowns["dedup_" + this.datasetId] = draft.date;
      const ds = draft.datasets.find((d) => d.id === this.datasetId);
      if (!ds) return;
      const reduction = 0.2 * matScale;
      for (const key of Object.keys(ds.domains)) {
        const dm = ds.domains[key];
        if (!dm) continue;
        const dupReduction = dm.duplication * reduction;
        dm.duplication = Math.max(0.01, dm.duplication - dupReduction);
      }
      ds.effectiveTokens = Object.values(ds.domains).reduce(
        (s, d) => s + d.tokens * d.quality * (1 - d.duplication),
        0
      );
    });
    events.emit("DATA_DEDUPED", {
      datasetId: this.datasetId,
      reductionRatio: Number((0.2 * (dedupMat / 100)).toFixed(3)),
      cost
    });
  }
};
var CurateDatasetCommand = class {
  constructor(datasetId, targetDomainId) {
    this.datasetId = datasetId;
    this.targetDomainId = targetDomainId;
  }
  execute(state, events) {
    const current2 = state.read();
    const curateMat = current2.techMaturity["data_curation"] ?? 0;
    if (curateMat < 1) {
      events.emit("DATA_CURATE_REJECTED", { reason: "\u672A\u89E3\u9501\u6570\u636E\u7CBE\u9009\u6280\u672F" });
      return;
    }
    const dataset = current2.datasets.find((d) => d.id === this.datasetId);
    if (!dataset) {
      events.emit("DATA_CURATE_REJECTED", { reason: "\u6570\u636E\u96C6\u4E0D\u5B58\u5728" });
      return;
    }
    const targetDomain = dataset.domains[this.targetDomainId];
    if (!targetDomain) {
      events.emit("DATA_CURATE_REJECTED", { reason: `\u9886\u57DF ${this.targetDomainId} \u4E0D\u5B58\u5728` });
      return;
    }
    if (targetDomain.tokens <= 0) {
      events.emit("DATA_CURATE_REJECTED", { reason: "\u76EE\u6807\u9886\u57DF\u65E0\u6570\u636E" });
      return;
    }
    const cooldowns = current2.dataAcquisitionCooldowns ?? {};
    const lastCurate = cooldowns["curate_" + this.datasetId] ?? -999;
    if (current2.date - lastCurate < CURATE_COOLDOWN) {
      events.emit("DATA_CURATE_REJECTED", {
        reason: `\u51B7\u5374\u4E2D\uFF0C\u5269\u4F59 ${CURATE_COOLDOWN - (current2.date - lastCurate)} \u5929`
      });
      return;
    }
    const matScale = curateMat / 100;
    const totalEffectiveTokensM = dataset.effectiveTokens * 1e3;
    const cost = Math.ceil(8 * totalEffectiveTokensM);
    const funds = current2.resources["funds"] ?? 0;
    if (funds < cost) {
      events.emit("DATA_CURATE_REJECTED", { reason: `\u8D44\u91D1\u4E0D\u8DB3\uFF0C\u9700\u8981 $${cost.toLocaleString()}` });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] = Math.max(0, (draft.resources["funds"] ?? 0) - cost);
      if (!draft.dataAcquisitionCooldowns) draft.dataAcquisitionCooldowns = {};
      draft.dataAcquisitionCooldowns["curate_" + this.datasetId] = draft.date;
      const ds = draft.datasets.find((d) => d.id === this.datasetId);
      if (!ds) return;
      const target = ds.domains[this.targetDomainId];
      if (!target) return;
      const qualityGain = (1 - target.quality) * 0.15 * matScale;
      target.quality = Math.min(1, target.quality + qualityGain);
      const otherLoss = 0.05;
      for (const key of Object.keys(ds.domains)) {
        if (key === this.targetDomainId) continue;
        const dm = ds.domains[key];
        if (!dm || dm.tokens <= 0) continue;
        dm.tokens = Math.max(0, dm.tokens * (1 - otherLoss));
      }
      ds.totalTokens = Object.values(ds.domains).reduce((s, d) => s + d.tokens, 0);
      ds.effectiveTokens = Object.values(ds.domains).reduce(
        (s, d) => s + d.tokens * d.quality * (1 - d.duplication),
        0
      );
    });
    events.emit("DATA_CURATED", {
      datasetId: this.datasetId,
      domainId: this.targetDomainId,
      qualityGain: Number(((1 - targetDomain.quality) * 0.15 * (curateMat / 100)).toFixed(3)),
      cost
    });
  }
};

// ../../src/core/commands/DepartmentCommands.ts
var AppointDepartmentHeadCommand = class {
  constructor(departmentId, employeeId) {
    this.departmentId = departmentId;
    this.employeeId = employeeId;
  }
  execute(state, events) {
    const current2 = state.read();
    const dept = current2.departments.find((d) => d.id === this.departmentId);
    if (!dept) {
      events.emit("APPOINT_HEAD_REJECTED", { reason: "\u90E8\u95E8\u4E0D\u5B58\u5728" });
      return;
    }
    const emp = current2.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit("APPOINT_HEAD_REJECTED", { reason: "\u5458\u5DE5\u4E0D\u5B58\u5728" });
      return;
    }
    if (emp.role !== dept.role) {
      events.emit("APPOINT_HEAD_REJECTED", {
        reason: `\u5458\u5DE5\u89D2\u8272\u4E0D\u5339\u914D\uFF0C\u9700 ${dept.role}`
      });
      return;
    }
    if (emp.level < DEPT_HEAD_MIN_LEVEL) {
      events.emit("APPOINT_HEAD_REJECTED", {
        reason: `\u7B49\u7EA7\u4E0D\u8DB3\uFF0C\u9700 L${DEPT_HEAD_MIN_LEVEL}+`
      });
      return;
    }
    const oldHeadId = dept.headId;
    state.update((draft) => {
      const d = draft.departments.find((x) => x.id === this.departmentId);
      if (!d) return;
      for (const other of draft.departments) {
        if (other.id !== d.id && other.headId === this.employeeId) {
          other.headId = null;
        }
      }
      d.headId = this.employeeId;
      if (!d.memberIds.includes(this.employeeId)) {
        d.memberIds.push(this.employeeId);
      }
      const target = draft.employees.find((e) => e.id === this.employeeId);
      if (target) {
        target.departmentId = d.id;
      }
    });
    events.emit("DEPT_HEAD_APPOINTED", {
      departmentId: this.departmentId,
      employeeId: this.employeeId,
      oldHeadId
    });
  }
};
var TransferDepartmentCommand = class {
  constructor(employeeId, targetDepartmentId) {
    this.employeeId = employeeId;
    this.targetDepartmentId = targetDepartmentId;
  }
  execute(state, events) {
    const current2 = state.read();
    const emp = current2.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit("TRANSFER_REJECTED", { reason: "\u5458\u5DE5\u4E0D\u5B58\u5728" });
      return;
    }
    if (this.targetDepartmentId) {
      const targetDept = current2.departments.find((d) => d.id === this.targetDepartmentId);
      if (!targetDept) {
        events.emit("TRANSFER_REJECTED", { reason: "\u76EE\u6807\u90E8\u95E8\u4E0D\u5B58\u5728" });
        return;
      }
      if (targetDept.role !== emp.role) {
        events.emit("TRANSFER_REJECTED", {
          reason: `\u89D2\u8272\u4E0D\u5339\u914D\uFF0C\u9700 ${targetDept.role}`
        });
        return;
      }
    }
    const oldDeptId = emp.departmentId;
    if (oldDeptId) {
      const oldDept = current2.departments.find((d) => d.id === oldDeptId);
      if (oldDept && oldDept.headId === this.employeeId) {
        events.emit("TRANSFER_REJECTED", {
          reason: "\u5458\u5DE5\u662F\u5F53\u524D\u90E8\u95E8\u8D1F\u8D23\u4EBA\uFF0C\u9700\u5148\u514D\u804C"
        });
        return;
      }
    }
    state.update((draft) => {
      if (oldDeptId) {
        const oldDept = draft.departments.find((d) => d.id === oldDeptId);
        if (oldDept) {
          oldDept.memberIds = oldDept.memberIds.filter((id) => id !== this.employeeId);
        }
      }
      if (this.targetDepartmentId) {
        const newDept = draft.departments.find((d) => d.id === this.targetDepartmentId);
        if (newDept && !newDept.memberIds.includes(this.employeeId)) {
          newDept.memberIds.push(this.employeeId);
        }
      }
      const target = draft.employees.find((e) => e.id === this.employeeId);
      if (target) {
        target.departmentId = this.targetDepartmentId ?? void 0;
      }
    });
    events.emit("EMPLOYEE_TRANSFERRED", {
      employeeId: this.employeeId,
      oldDeptId,
      newDeptId: this.targetDepartmentId
    });
  }
};
var AllocateNormalStaffCommand = class {
  constructor(departmentType, count) {
    this.departmentType = departmentType;
    this.count = count;
  }
  execute(state, events) {
    if (this.count === 0) {
      events.emit("ALLOCATE_NORMAL_REJECTED", { reason: "\u6570\u91CF\u4E0D\u80FD\u4E3A 0" });
      return;
    }
    const current2 = state.read();
    const dept = current2.departments.find((d) => d.type === this.departmentType);
    if (!dept) {
      events.emit("ALLOCATE_NORMAL_REJECTED", { reason: "\u90E8\u95E8\u4E0D\u5B58\u5728" });
      return;
    }
    const role = dept.role;
    const resourceId = ROLE_TO_STAFF_RESOURCE[role];
    const available = current2.resources[resourceId] ?? 0;
    if (this.count > 0) {
      if (available < this.count) {
        events.emit("ALLOCATE_NORMAL_REJECTED", {
          reason: `\u666E\u901A\u5458\u5DE5\u4E0D\u8DB3\uFF1A\u9700\u8981 ${this.count}\uFF0C\u53EF\u7528 ${available}`
        });
        return;
      }
      state.update((draft) => {
        draft.resources[resourceId] -= this.count;
        const d = draft.departments.find((x) => x.type === this.departmentType);
        if (d) d.normalHeadcount += this.count;
      });
    } else {
      const releaseCount = -this.count;
      if (dept.normalHeadcount < releaseCount) {
        events.emit("ALLOCATE_NORMAL_REJECTED", {
          reason: `\u90E8\u95E8\u666E\u901A\u5458\u5DE5\u4E0D\u8DB3\uFF1A\u9700\u8981\u56DE\u6536 ${releaseCount}\uFF0C\u5F53\u524D ${dept.normalHeadcount}`
        });
        return;
      }
      state.update((draft) => {
        draft.resources[resourceId] += releaseCount;
        const d = draft.departments.find((x) => x.type === this.departmentType);
        if (d) d.normalHeadcount -= releaseCount;
      });
    }
    events.emit("NORMAL_STAFF_ALLOCATED", {
      departmentType: this.departmentType,
      delta: this.count
    });
  }
};

// ../../src/core/commands/DistillCompetitorCommand.ts
function genId6(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
var DISTILL_COOLDOWN = 90;
var DistillCompetitorCommand = class {
  constructor(competitorId, modelIndex, studentName) {
    this.competitorId = competitorId;
    this.modelIndex = modelIndex;
    this.studentName = studentName;
  }
  execute(state, events) {
    const current2 = state.read();
    const distillMat = current2.techMaturity["distillation"] ?? 0;
    if (distillMat < 1) {
      events.emit("DISTILL_REJECTED", { reason: "\u672A\u89E3\u9501\u84B8\u998F\u6280\u672F" });
      return;
    }
    const competitor = current2.competitorStates.find((c) => c.id === this.competitorId);
    if (!competitor) {
      events.emit("DISTILL_REJECTED", { reason: "\u7ADE\u54C1\u516C\u53F8\u4E0D\u5B58\u5728" });
      return;
    }
    const targetModel = competitor.releasedModels[this.modelIndex];
    if (!targetModel) {
      events.emit("DISTILL_REJECTED", { reason: "\u76EE\u6807\u6A21\u578B\u5DF2\u4E0D\u5B58\u5728" });
      return;
    }
    if (current2.models.some((m) => m.name === this.studentName)) {
      events.emit("DISTILL_REJECTED", { reason: "\u6A21\u578B\u540D\u79F0\u5DF2\u5B58\u5728" });
      return;
    }
    const cooldowns = current2.dataAcquisitionCooldowns ?? {};
    const lastDistill = cooldowns["distill"] ?? -999;
    if (current2.date - lastDistill < DISTILL_COOLDOWN) {
      events.emit("DISTILL_REJECTED", {
        reason: `\u51B7\u5374\u4E2D\uFF0C\u5269\u4F59 ${DISTILL_COOLDOWN - (current2.date - lastDistill)} \u5929`
      });
      return;
    }
    const matScale = distillMat / 100;
    const distillEfficiency = Math.min(0.95, 0.7 * matScale);
    const studentParams = targetModel.paramCount * 0.15;
    const fundsCost = 5e4 * targetModel.paramCount;
    const funds = current2.resources["funds"] ?? 0;
    if (funds < fundsCost) {
      events.emit("DISTILL_REJECTED", { reason: `\u8D44\u91D1\u4E0D\u8DB3\uFF0C\u9700\u8981 $${fundsCost.toLocaleString()}` });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] = Math.max(0, (draft.resources["funds"] ?? 0) - fundsCost);
      if (!draft.dataAcquisitionCooldowns) draft.dataAcquisitionCooldowns = {};
      draft.dataAcquisitionCooldowns["distill"] = draft.date;
      const comp = draft.competitorStates.find((c) => c.id === this.competitorId);
      const tm = comp?.releasedModels[this.modelIndex];
      if (!tm || !comp) return;
      const caps = comp.capabilities;
      const capVector = {};
      const rawCapVector = {};
      let baseScoreSum = 0;
      let capCount = 0;
      for (const [capId, value] of Object.entries(caps)) {
        const studentVal = value * distillEfficiency;
        capVector[capId] = studentVal;
        rawCapVector[capId] = studentVal;
        baseScoreSum += studentVal;
        capCount++;
      }
      const avgCap = capCount > 0 ? baseScoreSum / capCount : tm.baseScore * distillEfficiency;
      const model = {
        id: genId6("distill-model"),
        name: this.studentName,
        paramCount: Math.max(1, Math.round(studentParams)),
        architecture: "distilled",
        contextLength: 4096,
        datasetId: "",
        // 蒸馏不使用数据集
        completedAt: draft.date,
        trainingProjectId: "distillation",
        capabilities: capVector,
        rawCapabilities: rawCapVector,
        baseScore: avgCap,
        daysSincePublished: 0,
        evaluationResearchers: 0,
        published: false,
        version: 1,
        audited: false,
        usedInResearch: false,
        noiseSeed: Math.floor(Math.random() * 1e9),
        // PR-B v3：后训练状态初始为空
        postTraining: []
      };
      draft.models.push(model);
    });
    events.emit("MODEL_DISTILLED", {
      studentName: this.studentName,
      teacherName: targetModel.name,
      studentParams: Math.max(1, Math.round(studentParams)),
      distillEfficiency: Number(distillEfficiency.toFixed(2)),
      fundsCost
    });
  }
};

// ../../src/core/commands/FireEmployeeCommand.ts
var FireEmployeeCommand = class {
  constructor(employeeId) {
    this.employeeId = employeeId;
  }
  execute(state, events) {
    const current2 = state.read();
    const emp = current2.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit("FIRE_FAILED", { employeeId: this.employeeId, reason: "\u5458\u5DE5\u4E0D\u5B58\u5728" });
      return;
    }
    const wasAssigned = emp.status === "assigned";
    const projectId = emp.assignedProjectId;
    const wasLoyal = emp.loyalty > 60;
    state.update((draft) => {
      if (emp.departmentId) {
        const dept = draft.departments.find((d) => d.id === emp.departmentId);
        if (dept) {
          dept.memberIds = dept.memberIds.filter((id) => id !== this.employeeId);
          if (dept.headId === this.employeeId) {
            dept.headId = null;
          }
        }
      }
      if (emp.trainingId) {
        const training = draft.staffTrainings.find((t) => t.id === emp.trainingId);
        if (training && training.status === "in_progress") {
          training.status = "cancelled";
        }
      }
      const exec = draft.executives;
      if (exec.ceoId === this.employeeId) exec.ceoId = null;
      if (exec.cooId === this.employeeId) exec.cooId = null;
      if (exec.cfoId === this.employeeId) exec.cfoId = null;
      if (exec.ctoId === this.employeeId) exec.ctoId = null;
      draft.employees = draft.employees.filter((e) => e.id !== this.employeeId);
    });
    events.emit("EMPLOYEE_FIRED", emp);
    if (wasLoyal) {
      state.update((draft) => {
        for (const e of draft.employees) {
          e.loyalty = Math.max(0, e.loyalty - 5);
        }
      });
      events.emit("MORALE_IMPACT", { reason: "high_loyalty_fired", target: this.employeeId });
    }
    if (wasAssigned && projectId) {
      events.emit("PROJECT_RESOURCE_RELEASED", {
        projectId,
        employeeId: this.employeeId,
        type: "employee"
      });
    }
  }
};

// ../../src/core/commands/GridPowerCommand.ts
function genId7(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
var BuyGridPowerCommand = class {
  constructor(kw) {
    this.kw = kw;
  }
  execute(state, events) {
    if (this.kw <= 0) {
      events.emit("GRID_POWER_REJECTED", { reason: "\u8D2D\u7535\u91CF\u5FC5\u987B\u5927\u4E8E 0" });
      return;
    }
    const current2 = state.read();
    const hqRegionId = current2.headquartersRegionId;
    if (!hqRegionId) {
      events.emit("GRID_POWER_REJECTED", { reason: "\u672A\u8BBE\u7F6E\u603B\u90E8\u5730\u533A" });
      return;
    }
    const region = REGIONS.find((r) => r.id === hqRegionId);
    if (!region) {
      events.emit("GRID_POWER_REJECTED", { reason: "\u5730\u533A\u6570\u636E\u4E0D\u5B58\u5728" });
      return;
    }
    const gridContracts = current2.resourceMeta["grid_power_contracts"] ?? [];
    const alreadyBought = gridContracts.reduce((s, c) => s + c.kw, 0);
    const regionCap = getGridPowerCap(region);
    if (alreadyBought + this.kw > regionCap) {
      events.emit("GRID_POWER_REJECTED", {
        reason: `\u8D85\u51FA\u5730\u533A\u7535\u7F51\u5BB9\u91CF\u4E0A\u9650\uFF08\u5DF2\u8D2D ${alreadyBought} kW\uFF0C\u4E0A\u9650 ${regionCap} kW\uFF09`,
        cap: regionCap,
        bought: alreadyBought
      });
      return;
    }
    const pricePerKW = getGridPowerPrice(region);
    const totalCost = this.kw * pricePerKW;
    const funds = current2.resources["funds"] ?? 0;
    if (funds < totalCost) {
      events.emit("GRID_POWER_REJECTED", {
        reason: "\u8D44\u91D1\u4E0D\u8DB3",
        required: totalCost,
        funds
      });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] -= totalCost;
      draft.resources["power_kw"] = (draft.resources["power_kw"] ?? 0) + this.kw;
      const contracts = draft.resourceMeta["grid_power_contracts"] ?? [];
      contracts.push({
        id: genId7("grid"),
        kw: this.kw,
        pricePerKW,
        totalCost,
        regionId: hqRegionId,
        purchasedAt: draft.date
      });
      draft.resourceMeta["grid_power_contracts"] = contracts;
    });
    events.emit("GRID_POWER_PURCHASED", {
      kw: this.kw,
      pricePerKW,
      totalCost,
      region: region.name
    });
  }
};

// ../../src/core/commands/HireEmployeeCommand.ts
function genId8(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function generateName(regionId) {
  const region = regionId ? REGION_MAP[regionId] : null;
  const langs = region?.primaryLanguages ?? ["en"];
  const isChinese = langs.some((l) => l.startsWith("zh"));
  if (isChinese) {
    const surnames = ["\u674E", "\u738B", "\u5F20", "\u5218", "\u9648", "\u6768", "\u8D75", "\u9EC4", "\u5468", "\u5434", "\u5F90", "\u5B59", "\u9A6C", "\u6731", "\u80E1"];
    const givenNames = ["\u4F1F", "\u82B3", "\u5A1C", "\u654F", "\u9759", "\u4E3D", "\u5F3A", "\u78CA", "\u519B", "\u6D0B", "\u52C7", "\u8273", "\u6770", "\u6D9B", "\u660E", "\u8D85", "\u971E", "\u5E73", "\u521A", "\u6842\u82F1"];
    return `${surnames[Math.floor(Math.random() * surnames.length)]}${givenNames[Math.floor(Math.random() * givenNames.length)]}`;
  }
  const firstNames = ["James", "John", "Robert", "Michael", "William", "David", "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Thomas", "Christopher", "Daniel", "Matthew", "Emily"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson"];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}
var RequestRecruitmentCommand = class {
  constructor(role, channel) {
    this.role = role;
    this.channel = channel;
  }
  execute(state, events) {
    const channelCfg = RECRUITMENT_CHANNELS[this.channel];
    if (!channelCfg) {
      events.emit("RECRUITMENT_REJECTED", { reason: "\u672A\u77E5\u62DB\u8058\u6E20\u9053" });
      return;
    }
    const roleCfg = ROLE_CONFIG[this.role];
    if (!roleCfg) {
      events.emit("RECRUITMENT_REJECTED", { reason: "\u672A\u77E5\u89D2\u8272" });
      return;
    }
    if (this.channel === "internal_promote") {
      events.emit("RECRUITMENT_REJECTED", { reason: "\u5185\u90E8\u664B\u5347\u8BF7\u4F7F\u7528 PromoteEmployeeCommand" });
      return;
    }
    const current2 = state.read();
    const roleCoreCount = current2.employees.filter((e) => e.role === this.role).length;
    if (roleCoreCount >= CORE_EMPLOYEE_CAP_PER_ROLE) {
      events.emit("RECRUITMENT_REJECTED", {
        reason: `\u6838\u5FC3\u5458\u5DE5\u5DF2\u8FBE\u4E0A\u9650\uFF08${CORE_EMPLOYEE_CAP_PER_ROLE}\u4EBA\uFF09`
      });
      return;
    }
    const funds = current2.resources["funds"] ?? 0;
    if (funds < channelCfg.cost) {
      events.emit("RECRUITMENT_REJECTED", {
        reason: "\u8D44\u91D1\u4E0D\u8DB3",
        cost: channelCfg.cost,
        funds
      });
      return;
    }
    const hqRegionId = current2.headquartersRegionId;
    const hqRegion = hqRegionId ? REGIONS.find((r) => r.id === hqRegionId) ?? null : null;
    const talentBonus = hqRegion ? (hqRegion.talentIndex - 50) / 100 : 0;
    const candidates = [];
    for (let i = 0; i < channelCfg.candidateCount; i++) {
      const [minLv, maxLv] = channelCfg.levelRange;
      const level = Math.floor(minLv + Math.random() * (maxLv - minLv + 1));
      const baseAttr = channelCfg.baseAttribute + talentBonus * 25;
      const attributes = generateCandidateAttributes(baseAttr, roleCfg.attributeWeights, level);
      const expectedSalary = calcSalaryForLevel(this.role, level, hqRegion);
      candidates.push({
        id: genId8("cand"),
        name: generateName(hqRegionId),
        role: this.role,
        attributes,
        level,
        channel: this.channel,
        expectedSalary,
        generatedDay: current2.date,
        status: "pending"
      });
    }
    state.update((draft) => {
      draft.resources["funds"] -= channelCfg.cost;
      draft.pendingCandidates.push(...candidates);
    });
    events.emit("RECRUITMENT_REQUESTED", {
      channel: this.channel,
      role: this.role,
      candidateCount: candidates.length,
      cost: channelCfg.cost,
      deliveryDays: channelCfg.deliveryDays
    });
  }
};
var HireCandidateCommand = class {
  constructor(candidateId) {
    this.candidateId = candidateId;
  }
  execute(state, events) {
    const current2 = state.read();
    const candidate = current2.pendingCandidates.find((c) => c.id === this.candidateId);
    if (!candidate) {
      events.emit("HIRE_REJECTED", { reason: "\u5019\u9009\u4EBA\u4E0D\u5B58\u5728" });
      return;
    }
    if (candidate.status !== "pending") {
      events.emit("HIRE_REJECTED", { reason: "\u5019\u9009\u4EBA\u5DF2\u88AB\u5904\u7406" });
      return;
    }
    const roleCoreCount = current2.employees.filter((e) => e.role === candidate.role).length;
    if (roleCoreCount >= CORE_EMPLOYEE_CAP_PER_ROLE) {
      events.emit("HIRE_REJECTED", {
        reason: `\u6838\u5FC3\u5458\u5DE5\u5DF2\u8FBE\u4E0A\u9650\uFF08${CORE_EMPLOYEE_CAP_PER_ROLE}\u4EBA\uFF09`
      });
      return;
    }
    const roleCfg = ROLE_CONFIG[candidate.role];
    const skills = roleCfg.skillPool.map((skillId) => {
      const cfg = SKILL_CONFIG[skillId];
      if (!cfg) {
        return {
          id: skillId,
          name: skillId,
          description: "",
          effect: { type: "unknown", value: 0 },
          unlocked: false,
          cost: 1
        };
      }
      return { ...cfg, unlocked: false };
    });
    const employee = {
      id: genId8("emp"),
      name: candidate.name,
      role: candidate.role,
      attributes: candidate.attributes,
      skills,
      skillPoints: 0,
      level: candidate.level,
      salary: candidate.expectedSalary,
      loyalty: 70,
      fatigue: 0,
      status: "idle",
      hireDay: current2.date,
      experience: 0
    };
    state.update((draft) => {
      draft.employees.push(employee);
      const cand = draft.pendingCandidates.find((c) => c.id === this.candidateId);
      if (cand) cand.status = "hired";
      const dept = draft.departments.find(
        (d) => DEPARTMENT_ROLE_MAP[d.type] === candidate.role
      );
      if (dept) {
        dept.memberIds.push(employee.id);
        const emp = draft.employees[draft.employees.length - 1];
        if (emp) emp.departmentId = dept.id;
      }
    });
    events.emit("EMPLOYEE_HIRED", employee, 0);
  }
};
var RejectCandidateCommand = class {
  constructor(candidateId) {
    this.candidateId = candidateId;
  }
  execute(state, events) {
    const current2 = state.read();
    const candidate = current2.pendingCandidates.find((c) => c.id === this.candidateId);
    if (!candidate) {
      events.emit("REJECT_CANDIDATE_FAILED", { reason: "\u5019\u9009\u4EBA\u4E0D\u5B58\u5728" });
      return;
    }
    state.update((draft) => {
      const cand = draft.pendingCandidates.find((c) => c.id === this.candidateId);
      if (cand) cand.status = "rejected";
    });
    events.emit("CANDIDATE_REJECTED", this.candidateId);
  }
};
var CleanupCandidatesCommand = class {
  execute(state, _events) {
    state.update((draft) => {
      draft.pendingCandidates = draft.pendingCandidates.filter((c) => c.status === "pending");
    });
  }
};
var HireEmployeeCommand = class {
  constructor(role, name) {
    this.role = role;
    this.name = name;
  }
  execute(state, events) {
    const cmd = new RequestRecruitmentCommand(this.role, "job_site");
    cmd.execute(state, events);
  }
};

// ../../src/core/commands/HireNormalEmployeeCommand.ts
var HireNormalEmployeeCommand = class {
  constructor(role) {
    this.role = role;
  }
  execute(state, events) {
    const roleCfg = ROLE_CONFIG[this.role];
    if (!roleCfg) {
      events.emit("HIRE_REJECTED", { role: this.role, reason: "\u672A\u77E5\u89D2\u8272" });
      return;
    }
    const staffResourceId = ROLE_TO_STAFF_RESOURCE[this.role];
    if (!staffResourceId) {
      events.emit("HIRE_REJECTED", { role: this.role, reason: "\u65E0\u5BF9\u5E94\u666E\u901A\u5458\u5DE5\u8D44\u6E90" });
      return;
    }
    const current2 = state.read();
    const currentCount = current2.resources[staffResourceId] ?? 0;
    const hireCost = calcNormalHireCost(currentCount);
    const funds = state.getResource("funds");
    if (funds < hireCost) {
      events.emit("HIRE_REJECTED", {
        role: this.role,
        reason: "\u8D44\u91D1\u4E0D\u8DB3",
        cost: hireCost,
        funds
      });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] = Math.max(0, (draft.resources["funds"] ?? 0) - hireCost);
      draft.resources[staffResourceId] = (draft.resources[staffResourceId] ?? 0) + 1;
      const dept = draft.departments.find(
        (d) => DEPARTMENT_ROLE_MAP[d.type] === this.role
      );
      if (dept) {
        dept.normalHeadcount += 1;
      }
    });
    const newCount = state.getResource(staffResourceId);
    events.emit("NORMAL_EMPLOYEE_HIRED", {
      role: this.role,
      staffResourceId,
      count: newCount,
      cost: hireCost
    });
  }
};
var HireNormalEmployeesBatchCommand = class {
  constructor(role, count) {
    this.role = role;
    this.count = count;
  }
  execute(state, events) {
    const roleCfg = ROLE_CONFIG[this.role];
    if (!roleCfg) {
      events.emit("HIRE_REJECTED", { role: this.role, reason: "\u672A\u77E5\u89D2\u8272" });
      return;
    }
    const staffResourceId = ROLE_TO_STAFF_RESOURCE[this.role];
    if (!staffResourceId) {
      events.emit("HIRE_REJECTED", { role: this.role, reason: "\u65E0\u5BF9\u5E94\u666E\u901A\u5458\u5DE5\u8D44\u6E90" });
      return;
    }
    if (this.count <= 0) return;
    const current2 = state.read();
    const startCount = current2.resources[staffResourceId] ?? 0;
    const funds = current2.resources["funds"] ?? 0;
    let totalCost = 0;
    let actualHire = 0;
    for (let i = 0; i < this.count; i++) {
      const cost = calcNormalHireCost(startCount + i);
      if (funds - totalCost < cost) break;
      totalCost += cost;
      actualHire += 1;
    }
    if (actualHire === 0) {
      events.emit("HIRE_REJECTED", {
        role: this.role,
        reason: "\u8D44\u91D1\u4E0D\u8DB3",
        cost: calcNormalHireCost(startCount),
        funds
      });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] = Math.max(0, (draft.resources["funds"] ?? 0) - totalCost);
      draft.resources[staffResourceId] = (draft.resources[staffResourceId] ?? 0) + actualHire;
      const dept = draft.departments.find(
        (d) => DEPARTMENT_ROLE_MAP[d.type] === this.role
      );
      if (dept) {
        dept.normalHeadcount += actualHire;
      }
    });
    events.emit("NORMAL_EMPLOYEE_HIRED", {
      role: this.role,
      staffResourceId,
      count: state.getResource(staffResourceId),
      cost: totalCost,
      batched: true,
      requested: this.count,
      hired: actualHire
    });
  }
};

// ../../src/core/commands/HostileCommands.ts
var M = 1e6;
function findComp(state, competitorId) {
  const current2 = state.read();
  const competitors = current2.competitorStates;
  if (!competitors) return null;
  const idx = competitors.findIndex((c) => c.id === competitorId);
  if (idx < 0) return null;
  return { comp: competitors[idx], idx };
}
function findCorp(state, corpId) {
  const current2 = state.read();
  const corps = current2.externalCorps;
  if (!corps) return null;
  const idx = corps.findIndex((c) => c.id === corpId);
  if (idx < 0) return null;
  return { corp: corps[idx], idx };
}
var AcquireCompetitorCommand = class {
  constructor(competitorId, offerPrice) {
    this.competitorId = competitorId;
    this.offerPrice = offerPrice;
  }
  execute(state, events) {
    const found = findComp(state, this.competitorId);
    if (!found) {
      events.emit("ACQUIRE_FAILED", this.competitorId, "\u7ADE\u4E89\u5BF9\u624B\u4E0D\u5B58\u5728");
      return;
    }
    const { comp } = found;
    const avgCap = Object.values(comp.capabilities).reduce((s, v) => s + v, 0) / 16;
    const valuation = (comp.funds * 10 + comp.computeUnits * 0.5 + comp.headcount * 0.2 + avgCap * 2) * M;
    const priceRatio = this.offerPrice / valuation;
    const infiltrationBonus = comp.infiltrationLevel * 0.1;
    const successChance = Math.min(0.95, 0.2 + priceRatio * 0.5 + infiltrationBonus);
    const current2 = state.read();
    const funds = current2.resources["funds"] ?? 0;
    if (funds < this.offerPrice) {
      events.emit("ACQUIRE_FAILED", this.competitorId, "\u8D44\u91D1\u4E0D\u8DB3");
      return;
    }
    const roll = Math.random();
    if (roll > successChance) {
      state.update((draft) => {
        draft.resources["funds"] = (draft.resources["funds"] ?? 0) - this.offerPrice * 0.1;
        draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 2);
      });
      events.emit("ACQUIRE_FAILED", this.competitorId, "\u76EE\u6807\u62D2\u7EDD\u62A5\u4EF7");
      return;
    }
    const compFundsActual = comp.funds * M;
    const compComputeUnits = Math.floor(comp.computeUnits * 0.8);
    const transferredResearchers = Math.min(10, Math.floor(comp.coreResearchers * 0.5));
    const transferredHeadcount = Math.floor(comp.headcount * 0.6);
    state.update((draft) => {
      draft.resources["funds"] = (draft.resources["funds"] ?? 0) - this.offerPrice + compFundsActual;
      const acquiredDcId = `dc-acq-${comp.id}-${draft.date}`;
      const acquiredClusterId = `cl-acq-${comp.id}-${draft.date}`;
      const nodeIdPrefix = `node-acq-${comp.id}-${draft.date}`;
      const cardsPerNode = 8;
      const totalCards = compComputeUnits;
      const nodeCount = Math.ceil(totalCards / cardsPerNode);
      const totalPowerKW = totalCards * 0.7 * 1.2;
      const totalPowerMW = Math.max(0.5, totalPowerKW / 1e3);
      draft.dataCenters.push({
        id: acquiredDcId,
        name: `${comp.name} \u6570\u636E\u4E2D\u5FC3`,
        location: draft.headquartersRegionId ?? "unknown",
        maxPowerMW: totalPowerMW,
        usedPowerMW: 0,
        coolingType: "liquid",
        pue: 1.1,
        basePue: 1.1,
        currentPue: 1.1,
        clusters: [acquiredClusterId],
        buildCost: 0,
        // 收购价已含
        maintenanceCostPerDay: 0,
        powerCostPerKWh: 0.1,
        builtAt: draft.date,
        lastMaintenanceDay: draft.date
      });
      const nodeIds = [];
      for (let i = 0; i < nodeCount; i++) {
        const nodeId = `${nodeIdPrefix}-${i}`;
        nodeIds.push(nodeId);
        const cardsInThisNode = Math.min(cardsPerNode, totalCards - i * cardsPerNode);
        draft.serverNodes.push({
          id: nodeId,
          name: `${comp.name} \u8282\u70B9 ${i + 1}`,
          slotCount: cardsPerNode,
          installedCards: [],
          // 卡实例稍后填充
          interconnect: "NVLink4",
          interconnectBandwidth: 900,
          powerSupplyKW: cardsPerNode * 0.7 * 1.2,
          maxPowerDrawKW: cardsInThisNode * 0.7,
          nvswitchGeneration: 4,
          reliability: 90,
          baseReliability: 90,
          nodeType: "dgx",
          cost: 0,
          maintenanceCost: 5,
          clusterId: acquiredClusterId,
          builtAt: draft.date,
          lastMaintenanceDay: draft.date
        });
      }
      draft.clusters.push({
        id: acquiredClusterId,
        name: `${comp.name} \u96C6\u7FA4`,
        nodes: nodeIds,
        network: "InfiniBand NDR",
        switchCapacity: 400,
        networkBandwidth: 50,
        networkTopology: "rail_optimized",
        maxNodes: nodeCount,
        maxTPDegree: 8,
        allReduceBandwidth: 50,
        parallelEfficiencyBase: 0.95,
        buildCost: 0,
        operationalCostPerDay: 10,
        utilizationBonus: 0.05,
        baseUtilizationBonus: 0.05,
        dataCenterId: acquiredDcId,
        storageType: "nvme_raid",
        storageIO: 100,
        storageCapacity: 100,
        storageCostPerDay: 5,
        createdAt: draft.date
      });
      const modelId = "compute_h100";
      if (!draft.resourceMeta[modelId]) {
        draft.resourceMeta[modelId] = [];
      }
      const rawPool = draft.resourceMeta[modelId];
      const pool = Array.isArray(rawPool) ? rawPool : [];
      for (let i = 0; i < totalCards; i++) {
        const nodeId = nodeIds[Math.floor(i / cardsPerNode)];
        const uid = `card-acq-${comp.id}-${draft.date}-${i}`;
        const card = {
          uid,
          modelId,
          status: "online",
          age: 0,
          assignedProjectId: null,
          purchasedAt: draft.date,
          location: nodeId
        };
        pool.push(card);
        const node = draft.serverNodes.find((n) => n.id === nodeId);
        if (node) node.installedCards.push(uid);
      }
      draft.resources[modelId] = (draft.resources[modelId] ?? 0) + totalCards;
      const currentResearcherCount = draft.employees.filter((e) => e.role === "researcher" /* RESEARCHER */).length;
      const slotsAvailable = Math.max(0, 10 - currentResearcherCount);
      const actualTransferred = Math.min(transferredResearchers, slotsAvailable);
      const eliteNames = [
        "\u9648\u5929\u77F3",
        "\u674E\u660E\u8FBE",
        "\u8D75\u601D\u9F50",
        "\u5218\u9E3F\u5112",
        "\u738B\u77E5\u8FDC",
        "\u5F20\u542F\u660E",
        "\u6768\u81F4\u65B0",
        "\u9EC4\u5C1A\u6587",
        "\u5434\u6069\u8FDC",
        "Rafael"
      ];
      for (let i = 0; i < actualTransferred; i++) {
        const level = 6 + Math.floor(Math.random() * 4);
        const suffix = Math.random().toString(36).slice(2, 5);
        draft.employees.push({
          id: `acq-emp-${draft.date}-${suffix}-${i}`,
          name: `${eliteNames[i % eliteNames.length]} (${comp.name}\u8F6C\u6295)`,
          role: "researcher" /* RESEARCHER */,
          attributes: {
            intelligence: 55 + Math.floor(Math.random() * 35),
            creativity: 50 + Math.floor(Math.random() * 35),
            leadership: 30 + Math.floor(Math.random() * 35),
            stamina: 40 + Math.floor(Math.random() * 35),
            charisma: 25 + Math.floor(Math.random() * 35)
          },
          skills: [],
          skillPoints: Math.max(0, level - 4),
          level,
          salary: 3e5 + Math.random() * 5e5,
          loyalty: 50 + Math.random() * 25,
          // 转投员工忠诚度中等
          fatigue: 10,
          status: "idle",
          hireDay: draft.date,
          experience: 200 + Math.random() * 2e3
        });
      }
      if (transferredHeadcount > 0) {
        draft.resources["staff_data_engineer"] = (draft.resources["staff_data_engineer"] ?? 0) + Math.floor(transferredHeadcount * 0.4);
        draft.resources["staff_system_engineer"] = (draft.resources["staff_system_engineer"] ?? 0) + Math.floor(transferredHeadcount * 0.3);
        draft.resources["staff_product_manager"] = (draft.resources["staff_product_manager"] ?? 0) + Math.floor(transferredHeadcount * 0.3);
      }
      const competitors = draft.competitorStates;
      const idx = competitors.findIndex((c) => c.id === this.competitorId);
      if (idx >= 0) competitors.splice(idx, 1);
    });
    events.emit("ACQUIRE_SUCCESS", comp.name, this.offerPrice, {
      acquiredCards: compComputeUnits,
      transferredResearchers,
      transferredHeadcount
    });
  }
};
var PoachTalentCommand = class {
  constructor(competitorId, budget) {
    this.competitorId = competitorId;
    this.budget = budget;
  }
  execute(state, events) {
    const found = findComp(state, this.competitorId);
    if (!found) {
      events.emit("POACH_FAILED", this.competitorId, "\u76EE\u6807\u4E0D\u5B58\u5728");
      return;
    }
    const { comp } = found;
    const current2 = state.read();
    const funds = current2.resources["funds"] ?? 0;
    if (funds < this.budget) {
      events.emit("POACH_FAILED", this.competitorId, "\u8D44\u91D1\u4E0D\u8DB3");
      return;
    }
    const budgetM = this.budget / M;
    const baseChance = Math.min(0.8, budgetM / 100);
    const infiltrationBonus = comp.infiltrationLevel * 0.15;
    const successChance = Math.min(0.95, baseChance + infiltrationBonus);
    const roll = Math.random();
    if (roll > successChance) {
      const detectionChance = 0.3;
      if (Math.random() < detectionChance) {
        state.update((draft) => {
          draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 5);
          draft.riskState.legalDebt += 0.5;
        });
        events.emit("POACH_EXPOSED", comp.name);
      }
      events.emit("POACH_FAILED", comp.name, "\u5BF9\u65B9\u53CD\u5236\u63AA\u65BD\u6210\u529F");
      return;
    }
    const poachedHeadcount = Math.floor(
      comp.headcount * 0.05 * (1 + comp.infiltrationLevel * 0.3)
    );
    let transferred = false;
    let failureReason = null;
    state.update((draft) => {
      draft.resources["funds"] = (draft.resources["funds"] ?? 0) - this.budget;
      const competitors = draft.competitorStates;
      const c = competitors.find((x) => x.id === this.competitorId);
      if (c) {
        c.coreResearchers = Math.max(1, c.coreResearchers - 1);
        c.headcount = Math.max(1, c.headcount - poachedHeadcount);
        c.trainingProgress = Math.max(0, c.trainingProgress - 15);
      }
      const researcherCount = draft.employees.filter((e) => e.role === "researcher" /* RESEARCHER */).length;
      const CORE_CAP = 10;
      if (researcherCount < CORE_CAP) {
        const eliteNames = [
          "\u5434\u6069\u8FDC",
          "\u9648\u5929\u77F3",
          "\u674E\u660E\u8FBE",
          "\u8D75\u601D\u9F50",
          "\u5218\u9E3F\u5112",
          "\u738B\u77E5\u8FDC",
          "\u5F20\u542F\u660E",
          "\u6768\u81F4\u65B0",
          "\u9EC4\u5C1A\u6587",
          "Rafael"
        ];
        const name = eliteNames[Math.floor(Math.random() * eliteNames.length)];
        const suffix = Math.random().toString(36).slice(2, 5);
        const level = 8 + Math.floor(Math.random() * 3);
        draft.employees.push({
          id: `poached-${draft.date}-${suffix}`,
          name: `${name} (${comp.name}\u6316\u89D2)`,
          role: "researcher" /* RESEARCHER */,
          attributes: {
            intelligence: 65 + Math.floor(Math.random() * 30),
            creativity: 55 + Math.floor(Math.random() * 35),
            leadership: 30 + Math.floor(Math.random() * 40),
            stamina: 40 + Math.floor(Math.random() * 40),
            charisma: 25 + Math.floor(Math.random() * 40)
          },
          skills: [],
          skillPoints: level - 3,
          // 高等级自带技能点
          level,
          salary: 4e5 + Math.random() * 6e5,
          // 高级人才薪资
          loyalty: 35 + Math.random() * 25,
          // 挖来的人忠诚度偏低
          fatigue: 10 + Math.random() * 15,
          status: "idle",
          hireDay: draft.date,
          experience: 300 + Math.random() * 3e3
        });
        transferred = true;
      } else {
        failureReason = `\u6838\u5FC3\u7814\u7A76\u5458\u5DF2\u8FBE\u4E0A\u9650\uFF08${CORE_CAP}\u4EBA\uFF09\uFF0C\u672C\u6B21\u6316\u89D2\u672A\u83B7\u5F97\u6838\u5FC3\u4EBA\u624D`;
      }
      if (poachedHeadcount > 0) {
        draft.resources["staff_data_engineer"] = (draft.resources["staff_data_engineer"] ?? 0) + Math.floor(poachedHeadcount * 0.4);
        draft.resources["staff_system_engineer"] = (draft.resources["staff_system_engineer"] ?? 0) + Math.floor(poachedHeadcount * 0.3);
        draft.resources["staff_product_manager"] = (draft.resources["staff_product_manager"] ?? 0) + Math.floor(poachedHeadcount * 0.3);
      }
    });
    if (transferred) {
      events.emit("POACH_SUCCESS", comp.name, 1, poachedHeadcount);
    } else {
      events.emit("POACH_PARTIAL", comp.name, poachedHeadcount, failureReason ?? "\u672A\u77E5\u539F\u56E0");
    }
  }
};
var ASSAULT_KEY_PERSONNEL_COST = 1e7;
var AssaultKeyPersonnelCommand = class {
  constructor(competitorId) {
    this.competitorId = competitorId;
  }
  execute(state, events) {
    const found = findComp(state, this.competitorId);
    if (!found) {
      events.emit("ASSAULT_FAILED", this.competitorId, "\u76EE\u6807\u5DF2\u4E0D\u5B58\u5728\uFF08\u53EF\u80FD\u5DF2\u88AB\u6536\u8D2D\u6216\u7834\u4EA7\uFF09");
      return;
    }
    const { comp } = found;
    const funds = state.read().resources["funds"] ?? 0;
    if (funds < ASSAULT_KEY_PERSONNEL_COST) {
      events.emit("ASSAULT_REJECTED", `\u8D44\u91D1\u4E0D\u8DB3\uFF0C\u9700\u8981 $${ASSAULT_KEY_PERSONNEL_COST.toLocaleString()}`);
      return;
    }
    const successChance = 0.05 + comp.infiltrationLevel * 0.03;
    const exposureChance = 0.8 - comp.infiltrationLevel * 0.1;
    const successRoll = Math.random();
    const exposureRoll = Math.random();
    if (exposureRoll < exposureChance) {
      state.update((draft) => {
        draft.resources["funds"] = (draft.resources["funds"] ?? 0) - ASSAULT_KEY_PERSONNEL_COST;
        draft.riskState.reputation = 0;
        draft.riskState.legalDebt = 20;
        draft.riskState.employeeMorale = 0;
      });
      events.emit("ASSAULT_EXPOSED", comp.name, "\u521B\u59CB\u4EBA\u9762\u4E34\u7EC8\u8EAB\u76D1\u7981");
      return;
    }
    if (successRoll < successChance) {
      state.update((draft) => {
        draft.resources["funds"] = (draft.resources["funds"] ?? 0) - ASSAULT_KEY_PERSONNEL_COST;
        const competitors = draft.competitorStates;
        const c = competitors.find((x) => x.id === this.competitorId);
        if (c) {
          c.coreResearchers = Math.max(1, c.coreResearchers - Math.floor(c.coreResearchers * 0.5));
          c.trainingProgress = Math.max(0, c.trainingProgress - 50);
        }
      });
      events.emit("ASSAULT_SUCCESS", comp.name);
    } else {
      state.update((draft) => {
        draft.resources["funds"] = (draft.resources["funds"] ?? 0) - ASSAULT_KEY_PERSONNEL_COST;
      });
      events.emit("ASSAULT_FAILED", comp.name);
    }
  }
};
var HACK_PARAMETERS_COST = 15e6;
var STOLEN_MODEL_CAPABILITY_DISCOUNT = 0.7;
var HackParametersCommand = class {
  constructor(competitorId) {
    this.competitorId = competitorId;
  }
  execute(state, events) {
    const found = findComp(state, this.competitorId);
    if (!found) {
      events.emit("HACK_FAILED", this.competitorId, "\u76EE\u6807\u5DF2\u4E0D\u5B58\u5728\uFF08\u53EF\u80FD\u5DF2\u88AB\u6536\u8D2D\u6216\u7834\u4EA7\uFF09");
      return;
    }
    const { comp } = found;
    const funds = state.read().resources["funds"] ?? 0;
    if (funds < HACK_PARAMETERS_COST) {
      events.emit("HACK_REJECTED", `\u8D44\u91D1\u4E0D\u8DB3\uFF0C\u9700\u8981 $${HACK_PARAMETERS_COST.toLocaleString()}`);
      return;
    }
    const successChance = 0.15 + comp.infiltrationLevel * 0.08;
    const exposureChance = 0.7 - comp.infiltrationLevel * 0.1;
    const exposureRoll = Math.random();
    const successRoll = Math.random();
    if (exposureRoll < exposureChance) {
      state.update((draft) => {
        draft.resources["funds"] = (draft.resources["funds"] ?? 0) - HACK_PARAMETERS_COST;
        draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 80);
        draft.riskState.legalDebt = 15;
        draft.riskState.trustDebt = 10;
      });
      events.emit("HACK_EXPOSED", comp.name, "\u56FD\u9645\u5211\u4E8B\u6307\u63A7");
      return;
    }
    if (successRoll < successChance) {
      const latestRelease = comp.releasedModels[comp.releasedModels.length - 1];
      const realParamCount = latestRelease ? latestRelease.paramCount : Math.max(
        7,
        Math.round(Math.exp(Math.log(175) * Math.max(...Object.values(comp.capabilities)) / 1500))
      );
      state.update((draft) => {
        draft.resources["funds"] = (draft.resources["funds"] ?? 0) - HACK_PARAMETERS_COST;
        const stolenScore = Math.max(...Object.values(comp.capabilities)) * STOLEN_MODEL_CAPABILITY_DISCOUNT;
        const discountedCaps = Object.fromEntries(
          Object.entries(comp.capabilities).map(([k, v]) => [k, v * STOLEN_MODEL_CAPABILITY_DISCOUNT])
        );
        const newModel = {
          id: `stolen-${comp.id}-${draft.date}`,
          name: `${comp.name} \u53C2\u6570\u6CC4\u6F0F\u7248`,
          paramCount: realParamCount,
          architecture: "dense+rmsnorm+rope",
          contextLength: 8192,
          datasetId: "leaked",
          completedAt: draft.date,
          trainingProjectId: "",
          capabilities: discountedCaps,
          rawCapabilities: discountedCaps,
          baseScore: stolenScore,
          daysSincePublished: 0,
          evaluationResearchers: 0,
          published: false,
          version: 1,
          audited: false,
          usedInResearch: false,
          noiseSeed: Math.floor(Math.random() * 2147483647),
          postTraining: []
        };
        draft.models.push(newModel);
      });
      events.emit("HACK_SUCCESS", comp.name);
    } else {
      state.update((draft) => {
        draft.resources["funds"] = (draft.resources["funds"] ?? 0) - HACK_PARAMETERS_COST;
      });
      events.emit("HACK_FAILED", comp.name);
    }
  }
};
var InfiltrateCorpCommand = class {
  constructor(corpId, investment) {
    this.corpId = corpId;
    this.investment = investment;
  }
  execute(state, events) {
    const found = findCorp(state, this.corpId);
    if (!found) {
      events.emit("INFILTRATE_FAILED", this.corpId, "\u4F01\u4E1A\u4E0D\u5B58\u5728");
      return;
    }
    const { corp } = found;
    const current2 = state.read();
    const funds = current2.resources["funds"] ?? 0;
    if (funds < this.investment) {
      events.emit("INFILTRATE_FAILED", this.corpId, "\u8D44\u91D1\u4E0D\u8DB3");
      return;
    }
    const equityGained = this.investment / (50 * M * corp.infiltrationDifficulty);
    const newEquity = Math.min(1, corp.playerEquity + equityGained);
    state.update((draft) => {
      draft.resources["funds"] = (draft.resources["funds"] ?? 0) - this.investment;
      const corps = draft.externalCorps;
      const c = corps.find((x) => x.id === this.corpId);
      if (c) {
        c.playerEquity = newEquity;
        if (c.industry === "gpu") {
          c.effects.gpuDiscount = Math.min(0.5, newEquity * 0.5);
          c.effects.gpuPriority = Math.min(1, newEquity * 2);
        } else if (c.industry === "cloud") {
          c.effects.cloudDiscount = Math.min(0.5, newEquity * 0.5);
        } else if (c.industry === "defense") {
          c.effects.defenseAccess = newEquity > 0.15;
        }
      }
    });
    events.emit("INFILTRATE_SUCCESS", corp.name, this.investment, newEquity);
  }
};

// ../../src/core/commands/IdeaCommands.ts
function calcSuccessProbability(emp) {
  const raw = 0.3 + (emp.attributes.intelligence - 50) * 4e-3 + (emp.attributes.creativity - 50) * 5e-3 + emp.level * 0.02;
  return Math.max(0.3, Math.min(0.85, raw));
}
var AcceptIdeaCommand = class {
  constructor(ideaId) {
    this.ideaId = ideaId;
  }
  execute(state, events) {
    const current2 = state.read();
    const idea = current2.pendingIdeas.find((i) => i.id === this.ideaId);
    if (!idea || idea.status !== "pending") {
      events.emit("IDEA_REJECTED", { reason: idea ? "idea \u5DF2\u5904\u7406" : "idea \u4E0D\u5B58\u5728" });
      return;
    }
    const emp = current2.employees.find((e) => e.id === idea.sourceEmployeeId);
    if (!emp) {
      events.emit("IDEA_REJECTED", { reason: "\u63D0\u51FA\u8005\u5DF2\u79BB\u804C" });
      return;
    }
    if (idea.kind === "unique" && !canAcceptUniqueTechs(current2, 1)) {
      const used = getUniqueTechCount(current2);
      const max = getMaxUniqueTechSlots(current2);
      events.emit("IDEA_REJECTED", {
        reason: `\u72EC\u6709\u6280\u672F\u69FD\u4F4D\u5DF2\u6EE1 (${used}/${max})\uFF0C\u9700\u5148\u63D0\u5347\u516C\u53F8\u89C4\u6A21\u6216\u7814\u7A76\u5458\u6570\u91CF`
      });
      return;
    }
    const successProb = calcSuccessProbability(emp);
    const baseDays = idea.kind === "unique" ? 5 : 3;
    const uncertaintyDays = idea.kind === "unique" ? 12 : 7;
    const totalDays = Math.round(baseDays + (1 - successProb) * uncertaintyDays);
    const dailyCost = idea.kind === "unique" ? 3500 : 2e3;
    const funds = current2.resources["funds"] ?? 0;
    if (funds < dailyCost) {
      events.emit("IDEA_REJECTED", { reason: `\u8D44\u91D1\u4E0D\u8DB3\uFF08\u9700\u8981 $${dailyCost}/\u5929\uFF09` });
      return;
    }
    state.update((draft) => {
      const target = draft.pendingIdeas.find((i) => i.id === this.ideaId);
      if (!target) return;
      target.status = "verifying";
      target.verificationDays = 1;
      target.verificationTotalDays = totalDays;
      target.verificationDailyCost = dailyCost;
      target.successProbability = successProb;
      draft.resources["funds"] = (draft.resources["funds"] ?? 0) - dailyCost;
    });
    events.emit("IDEA_VERIFICATION_STARTED", {
      ideaId: idea.id,
      title: idea.title,
      totalDays,
      dailyCost,
      successProbability: successProb
    });
  }
};
var RejectIdeaCommand = class {
  constructor(ideaId) {
    this.ideaId = ideaId;
  }
  execute(state, events) {
    const current2 = state.read();
    const idea = current2.pendingIdeas.find((i) => i.id === this.ideaId);
    if (!idea || idea.status !== "pending") {
      events.emit("IDEA_REJECTED", { reason: "idea \u4E0D\u5B58\u5728\u6216\u5DF2\u5904\u7406" });
      return;
    }
    state.update((draft) => {
      const target = draft.pendingIdeas.find((i) => i.id === this.ideaId);
      if (target) target.status = "rejected";
      const emp = draft.employees.find((e) => e.id === idea.sourceEmployeeId);
      if (emp) emp.loyalty = Math.min(100, emp.loyalty + 2);
    });
    events.emit("IDEA_REJECTED_OK", idea);
  }
};

// ../../src/core/commands/IncentiveCommands.ts
var GiveBonusCommand = class {
  constructor(employeeId) {
    this.employeeId = employeeId;
  }
  execute(state, events) {
    const current2 = state.read();
    const emp = current2.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit("BONUS_REJECTED", { reason: "\u5458\u5DE5\u4E0D\u5B58\u5728" });
      return;
    }
    const lastBonus = emp.lastBonusDay ?? -999;
    if (current2.date - lastBonus < BONUS_COOLDOWN_DAYS) {
      const remain = BONUS_COOLDOWN_DAYS - (current2.date - lastBonus);
      events.emit("BONUS_REJECTED", {
        reason: `\u51B7\u5374\u4E2D\uFF0C\u5269\u4F59 ${remain} \u5929`
      });
      return;
    }
    const bonusAmount = Math.round(emp.salary * BONUS_SALARY_RATIO);
    const funds = current2.resources["funds"] ?? 0;
    if (funds < bonusAmount) {
      events.emit("BONUS_REJECTED", {
        reason: "\u8D44\u91D1\u4E0D\u8DB3",
        cost: bonusAmount,
        funds
      });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] -= bonusAmount;
      const target = draft.employees.find((e) => e.id === this.employeeId);
      if (target) {
        target.loyalty = clamp(target.loyalty + BONUS_LOYALTY_GAIN, 0, 100);
        target.lastBonusDay = draft.date;
      }
    });
    events.emit("BONUS_GIVEN", {
      employeeId: this.employeeId,
      amount: bonusAmount,
      loyaltyGain: BONUS_LOYALTY_GAIN
    });
  }
};
var GrantEquityCommand = class {
  constructor(employeeId) {
    this.employeeId = employeeId;
  }
  execute(state, events) {
    const current2 = state.read();
    const emp = current2.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit("EQUITY_REJECTED", { reason: "\u5458\u5DE5\u4E0D\u5B58\u5728" });
      return;
    }
    if (emp.hasEquity) {
      events.emit("EQUITY_REJECTED", { reason: "\u5458\u5DE5\u5DF2\u6301\u6709\u80A1\u6743" });
      return;
    }
    const recentEquityGrants = current2.employees.filter(
      (e) => e.hasEquity && e.equityGrantedDay !== void 0 && current2.date - e.equityGrantedDay < 30
    ).length;
    if (recentEquityGrants >= 3) {
      events.emit("EQUITY_REJECTED", {
        reason: `\u672C\u6708\u6388\u80A1\u6743\u914D\u989D\u5DF2\u7528\u5C3D\uFF0830 \u5929\u5185\u6700\u591A 3 \u4EBA\uFF09\uFF0C\u8BF7\u7B49\u5F85 ${30 - (current2.date - Math.min(...current2.employees.filter((e) => e.hasEquity && e.equityGrantedDay !== void 0).map((e) => e.equityGrantedDay)))} \u5929`
      });
      return;
    }
    const lastBonus = emp.lastBonusDay ?? -999;
    if (current2.date - lastBonus < EQUITY_COOLDOWN_DAYS && lastBonus > 0) {
      events.emit("EQUITY_REJECTED", {
        reason: `\u521A\u53D1\u8FC7\u5956\u91D1\uFF0C\u9700\u7B49\u5F85 ${EQUITY_COOLDOWN_DAYS - (current2.date - lastBonus)} \u5929`
      });
      return;
    }
    state.update((draft) => {
      const target = draft.employees.find((e) => e.id === this.employeeId);
      if (target) {
        target.hasEquity = true;
        target.equityGrantedDay = draft.date;
        target.loyalty = clamp(target.loyalty + EQUITY_LOYALTY_GAIN, 0, 100);
      }
    });
    events.emit("EQUITY_GRANTED", {
      employeeId: this.employeeId,
      loyaltyGain: EQUITY_LOYALTY_GAIN
    });
  }
};
var TeamBuildingCommand = class {
  execute(state, events) {
    const current2 = state.read();
    if (current2.date - current2.lastTeamBuildingDay < TEAM_BUILDING_COOLDOWN_DAYS) {
      const remain = TEAM_BUILDING_COOLDOWN_DAYS - (current2.date - current2.lastTeamBuildingDay);
      events.emit("TEAM_BUILDING_REJECTED", {
        reason: `\u51B7\u5374\u4E2D\uFF0C\u5269\u4F59 ${remain} \u5929`
      });
      return;
    }
    const headcount = current2.employees.length;
    if (headcount === 0) {
      events.emit("TEAM_BUILDING_REJECTED", { reason: "\u65E0\u5458\u5DE5" });
      return;
    }
    const cost = headcount * TEAM_BUILDING_COST_PER_HEAD;
    const funds = current2.resources["funds"] ?? 0;
    if (funds < cost) {
      events.emit("TEAM_BUILDING_REJECTED", {
        reason: "\u8D44\u91D1\u4E0D\u8DB3",
        cost,
        funds
      });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] -= cost;
      draft.lastTeamBuildingDay = draft.date;
      for (const emp of draft.employees) {
        emp.loyalty = clamp(emp.loyalty + TEAM_BUILDING_LOYALTY_GAIN, 0, 100);
        emp.fatigue = clamp(emp.fatigue - TEAM_BUILDING_FATIGUE_REDUCE, 0, 100);
      }
    });
    events.emit("TEAM_BUILDING_COMPLETED", {
      headcount,
      cost,
      loyaltyGain: TEAM_BUILDING_LOYALTY_GAIN,
      fatigueReduce: TEAM_BUILDING_FATIGUE_REDUCE
    });
  }
};

// ../../src/core/commands/InfraCommands.ts
function genId9(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
var BuyServerNodeCommand = class {
  constructor(templateId) {
    this.templateId = templateId;
  }
  execute(state, events) {
    const template = getNodeTemplate(this.templateId);
    if (!template) {
      events.emit("NODE_REJECTED", { reason: "\u672A\u77E5\u8282\u70B9\u6A21\u677F", templateId: this.templateId });
      return;
    }
    const funds = state.getResource("funds");
    if (funds < template.cost) {
      events.emit("NODE_REJECTED", { reason: "\u8D44\u91D1\u4E0D\u8DB3", cost: template.cost });
      return;
    }
    const today = state.read().date;
    const node = {
      id: genId9("node"),
      name: `${template.name} #${state.read().serverNodes.length + 1}`,
      slotCount: template.slotCount,
      installedCards: [],
      interconnect: template.interconnect,
      powerSupplyKW: template.powerSupplyKW,
      cost: template.cost,
      maintenanceCost: template.maintenanceCost,
      clusterId: null,
      builtAt: today,
      // P0 新增
      interconnectBandwidth: template.interconnectBandwidth,
      maxPowerDrawKW: template.maxPowerDrawKW,
      nvswitchGeneration: template.nvswitchGeneration,
      reliability: template.reliability,
      baseReliability: template.reliability,
      nodeType: template.nodeType,
      lastMaintenanceDay: today
    };
    state.update((draft) => {
      draft.resources["funds"] -= template.cost;
      draft.serverNodes.push(node);
    });
    events.emit("NODE_BUILT", node.id, node.name);
  }
};
var InstallCardCommand = class {
  constructor(cardUid, nodeId) {
    this.cardUid = cardUid;
    this.nodeId = nodeId;
  }
  execute(state, events) {
    const current2 = state.read();
    const node = current2.serverNodes.find((n) => n.id === this.nodeId);
    if (!node) {
      events.emit("CARD_INSTALL_REJECTED", { reason: "\u8282\u70B9\u4E0D\u5B58\u5728" });
      return;
    }
    if (node.installedCards.length >= node.slotCount) {
      events.emit("CARD_INSTALL_REJECTED", { reason: "\u8282\u70B9\u69FD\u4F4D\u5DF2\u6EE1" });
      return;
    }
    let cardFound = null;
    for (const defKey of Object.keys(current2.resourceMeta)) {
      const pool = current2.resourceMeta[defKey];
      if (!pool || !Array.isArray(pool)) continue;
      const card = pool.find((c) => c.uid === this.cardUid);
      if (card) {
        cardFound = { modelId: defKey, card };
        break;
      }
    }
    if (!cardFound) {
      events.emit("CARD_INSTALL_REJECTED", { reason: "\u5361\u5B9E\u4F8B\u4E0D\u5B58\u5728" });
      return;
    }
    if (cardFound.card.location !== null) {
      events.emit("CARD_INSTALL_REJECTED", { reason: "\u5361\u5DF2\u5B89\u88C5\u5728\u5176\u5B83\u8282\u70B9" });
      return;
    }
    const spec = getCardSpec(cardFound.modelId);
    if (spec) {
      const installedPower = node.installedCards.reduce((sum, uid) => {
        for (const defId of Object.keys(current2.resourceMeta)) {
          const p = current2.resourceMeta[defId];
          if (!Array.isArray(p)) continue;
          const c = p.find((x) => x.uid === uid);
          if (c) {
            const s = getCardSpec(defId);
            return sum + (s?.maxPowerDrawKW ?? 0);
          }
        }
        return sum;
      }, 0);
      if (installedPower + spec.maxPowerDrawKW > node.powerSupplyKW) {
        events.emit("CARD_INSTALL_REJECTED", { reason: "\u8282\u70B9\u4F9B\u7535\u4E0D\u8DB3" });
        return;
      }
    }
    state.update((draft) => {
      const n = draft.serverNodes.find((x) => x.id === this.nodeId);
      if (n) n.installedCards.push(this.cardUid);
      const pool = draft.resourceMeta[cardFound.modelId];
      if (Array.isArray(pool)) {
        const card = pool.find((c) => c.uid === this.cardUid);
        if (card) card.location = this.nodeId;
      }
    });
    events.emit("CARD_INSTALLED", this.cardUid, this.nodeId);
  }
};
var UninstallCardCommand = class {
  constructor(cardUid) {
    this.cardUid = cardUid;
  }
  execute(state, events) {
    const current2 = state.read();
    let modelId = "";
    let nodeId = null;
    for (const def of Object.keys(current2.resourceMeta)) {
      const pool = current2.resourceMeta[def];
      if (!pool || !Array.isArray(pool)) continue;
      const card = pool.find((c) => c.uid === this.cardUid);
      if (card) {
        modelId = def;
        nodeId = card.location;
        break;
      }
    }
    if (!modelId || nodeId === null) {
      events.emit("CARD_UNINSTALL_REJECTED", { reason: "\u5361\u672A\u5B89\u88C5\u5728\u4EFB\u4F55\u8282\u70B9" });
      return;
    }
    state.update((draft) => {
      const n = draft.serverNodes.find((x) => x.id === nodeId);
      if (n) {
        n.installedCards = n.installedCards.filter((uid) => uid !== this.cardUid);
      }
      const pool = draft.resourceMeta[modelId];
      if (Array.isArray(pool)) {
        const card = pool.find((c) => c.uid === this.cardUid);
        if (card) card.location = null;
      }
    });
    events.emit("CARD_UNINSTALLED", this.cardUid);
  }
};
var CreateClusterCommand = class {
  constructor(nodeIds, networkId) {
    this.nodeIds = nodeIds;
    this.networkId = networkId;
  }
  execute(state, events) {
    const network = getClusterNetwork(this.networkId);
    if (!network) {
      events.emit("CLUSTER_REJECTED", { reason: "\u672A\u77E5\u7F51\u7EDC\u7C7B\u578B" });
      return;
    }
    const current2 = state.read();
    const funds = current2.resources["funds"] ?? 0;
    const buildCost = network.costPerNode * this.nodeIds.length;
    if (funds < buildCost) {
      events.emit("CLUSTER_REJECTED", { reason: "\u8D44\u91D1\u4E0D\u8DB3", cost: buildCost });
      return;
    }
    if (this.nodeIds.length > network.maxNodes) {
      events.emit("CLUSTER_REJECTED", { reason: "\u8282\u70B9\u6570\u8D85\u8FC7\u7F51\u7EDC\u5BB9\u91CF" });
      return;
    }
    for (const nid of this.nodeIds) {
      const node = current2.serverNodes.find((n) => n.id === nid);
      if (!node) {
        events.emit("CLUSTER_REJECTED", { reason: `\u8282\u70B9 ${nid} \u4E0D\u5B58\u5728` });
        return;
      }
      if (node.clusterId !== null) {
        events.emit("CLUSTER_REJECTED", { reason: `\u8282\u70B9 ${nid} \u5DF2\u5C5E\u4E8E\u5176\u5B83\u96C6\u7FA4` });
        return;
      }
    }
    const cluster = {
      id: genId9("cluster"),
      name: `${network.name} \u96C6\u7FA4 #${current2.clusters.length + 1}`,
      nodes: [...this.nodeIds],
      network: network.name,
      switchCapacity: network.switchCapacity,
      maxNodes: network.maxNodes,
      buildCost,
      operationalCostPerDay: network.operationalCostPerDay,
      utilizationBonus: network.utilizationBonus,
      baseUtilizationBonus: network.utilizationBonus,
      dataCenterId: null,
      createdAt: current2.date,
      // P0 新增
      networkBandwidth: network.networkBandwidth,
      networkTopology: network.networkTopology,
      storageType: "local_ssd",
      storageIO: 1,
      storageCapacity: 10,
      storageCostPerDay: 5,
      parallelEfficiencyBase: network.parallelEfficiencyBase,
      maxTPDegree: network.maxTPDegree,
      allReduceBandwidth: network.allReduceBandwidth
    };
    state.update((draft) => {
      draft.resources["funds"] -= buildCost;
      draft.clusters.push(cluster);
      for (const nid of this.nodeIds) {
        const n = draft.serverNodes.find((x) => x.id === nid);
        if (n) n.clusterId = cluster.id;
      }
    });
    events.emit("CLUSTER_CREATED", cluster.id, cluster.name);
  }
};
var AddNodeToClusterCommand = class {
  constructor(clusterId, nodeId) {
    this.clusterId = clusterId;
    this.nodeId = nodeId;
  }
  execute(state, events) {
    const current2 = state.read();
    const cluster = current2.clusters.find((c) => c.id === this.clusterId);
    if (!cluster) {
      events.emit("CLUSTER_ADD_NODE_REJECTED", { reason: "\u96C6\u7FA4\u4E0D\u5B58\u5728" });
      return;
    }
    if (cluster.nodes.length >= cluster.maxNodes) {
      events.emit("CLUSTER_ADD_NODE_REJECTED", { reason: "\u96C6\u7FA4\u5DF2\u6EE1" });
      return;
    }
    const node = current2.serverNodes.find((n) => n.id === this.nodeId);
    if (!node) {
      events.emit("CLUSTER_ADD_NODE_REJECTED", { reason: "\u8282\u70B9\u4E0D\u5B58\u5728" });
      return;
    }
    if (node.clusterId !== null) {
      events.emit("CLUSTER_ADD_NODE_REJECTED", { reason: "\u8282\u70B9\u5DF2\u5C5E\u4E8E\u5176\u5B83\u96C6\u7FA4" });
      return;
    }
    state.update((draft) => {
      const c = draft.clusters.find((x) => x.id === this.clusterId);
      if (c) c.nodes.push(this.nodeId);
      const n = draft.serverNodes.find((x) => x.id === this.nodeId);
      if (n) n.clusterId = this.clusterId;
    });
    events.emit("NODE_ADDED_TO_CLUSTER", this.clusterId, this.nodeId);
  }
};
var BuildDataCenterCommand = class {
  constructor(locationId, maxPowerMW, coolingTypeId) {
    this.locationId = locationId;
    this.maxPowerMW = maxPowerMW;
    this.coolingTypeId = coolingTypeId;
  }
  execute(state, events) {
    const loc = getDataCenterLocation(this.locationId);
    if (!loc) {
      events.emit("DC_REJECTED", { reason: "\u672A\u77E5\u5730\u70B9" });
      return;
    }
    const cooling = getCoolingType(this.coolingTypeId);
    if (!cooling) {
      events.emit("DC_REJECTED", { reason: "\u672A\u77E5\u51B7\u5374\u65B9\u5F0F" });
      return;
    }
    const buildCost = loc.buildCostPerMW * this.maxPowerMW + cooling.extraBuildCostPerMW * this.maxPowerMW;
    const current2 = state.read();
    const funds = current2.resources["funds"] ?? 0;
    if (funds < buildCost) {
      events.emit("DC_REJECTED", { reason: "\u8D44\u91D1\u4E0D\u8DB3", cost: buildCost });
      return;
    }
    const actualPue = cooling.basePUE * loc.climateFactor;
    const dc = {
      id: genId9("dc"),
      name: `${loc.name} \u6570\u636E\u4E2D\u5FC3 #${current2.dataCenters.length + 1}`,
      location: loc.name,
      maxPowerMW: this.maxPowerMW,
      usedPowerMW: 0,
      coolingType: this.coolingTypeId,
      pue: actualPue,
      basePue: actualPue,
      currentPue: actualPue,
      clusters: [],
      buildCost,
      maintenanceCostPerDay: loc.maintenanceCostPerDay,
      powerCostPerKWh: loc.powerCostPerKWh,
      builtAt: current2.date,
      lastMaintenanceDay: current2.date
    };
    state.update((draft) => {
      draft.resources["funds"] -= buildCost;
      draft.dataCenters.push(dc);
    });
    events.emit("DC_BUILT", dc.id, dc.name);
  }
};
var MoveClusterCommand = class {
  constructor(clusterId, dataCenterId) {
    this.clusterId = clusterId;
    this.dataCenterId = dataCenterId;
  }
  execute(state, events) {
    const current2 = state.read();
    const cluster = current2.clusters.find((c) => c.id === this.clusterId);
    if (!cluster) {
      events.emit("CLUSTER_MOVE_REJECTED", { reason: "\u96C6\u7FA4\u4E0D\u5B58\u5728" });
      return;
    }
    const dc = current2.dataCenters.find((d) => d.id === this.dataCenterId);
    if (!dc) {
      events.emit("CLUSTER_MOVE_REJECTED", { reason: "\u6570\u636E\u4E2D\u5FC3\u4E0D\u5B58\u5728" });
      return;
    }
    let clusterPowerMW = 0;
    for (const nid of cluster.nodes) {
      const node = current2.serverNodes.find((n) => n.id === nid);
      if (!node) continue;
      for (const cardUid of node.installedCards) {
        for (const defId of Object.keys(current2.resourceMeta)) {
          const pool = current2.resourceMeta[defId];
          if (!Array.isArray(pool)) continue;
          const card = pool.find((c) => c.uid === cardUid);
          if (card) {
            const spec = getCardSpec(defId);
            clusterPowerMW += (spec?.maxPowerDrawKW ?? 0) / 1e3;
            break;
          }
        }
      }
    }
    const oldDcId = cluster.dataCenterId;
    const oldDcPower = clusterPowerMW;
    state.update((draft) => {
      if (oldDcId) {
        const oldDc = draft.dataCenters.find((d) => d.id === oldDcId);
        if (oldDc) {
          oldDc.usedPowerMW = Math.max(0, oldDc.usedPowerMW - oldDcPower);
          oldDc.clusters = oldDc.clusters.filter((id) => id !== this.clusterId);
        }
      }
      const newDc = draft.dataCenters.find((d) => d.id === this.dataCenterId);
      if (newDc) {
        newDc.clusters.push(this.clusterId);
        newDc.usedPowerMW += clusterPowerMW;
      }
      const c = draft.clusters.find((x) => x.id === this.clusterId);
      if (c) c.dataCenterId = this.dataCenterId;
    });
    events.emit("CLUSTER_MOVED", this.clusterId, this.dataCenterId);
  }
};
var UpgradeNodeInterconnectCommand = class {
  constructor(nodeId, targetTemplateId) {
    this.nodeId = nodeId;
    this.targetTemplateId = targetTemplateId;
  }
  execute(state, events) {
    const current2 = state.read();
    const node = current2.serverNodes.find((n) => n.id === this.nodeId);
    if (!node) {
      events.emit("NODE_UPGRADE_REJECTED", { reason: "\u8282\u70B9\u4E0D\u5B58\u5728" });
      return;
    }
    const target = getNodeTemplate(this.targetTemplateId);
    if (!target) {
      events.emit("NODE_UPGRADE_REJECTED", { reason: "\u672A\u77E5\u8282\u70B9\u6A21\u677F" });
      return;
    }
    if (target.interconnectBandwidth <= node.interconnectBandwidth) {
      events.emit("NODE_UPGRADE_REJECTED", { reason: "\u76EE\u6807\u4E92\u8054\u5E26\u5BBD\u4E0D\u9AD8\u4E8E\u5F53\u524D" });
      return;
    }
    const bwDiff = target.interconnectBandwidth - node.interconnectBandwidth;
    const cost = bwDiff * 50;
    const funds = current2.resources["funds"] ?? 0;
    if (funds < cost) {
      events.emit("NODE_UPGRADE_REJECTED", { reason: "\u8D44\u91D1\u4E0D\u8DB3", cost });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] -= cost;
      const n = draft.serverNodes.find((x) => x.id === this.nodeId);
      if (n) {
        n.interconnect = target.interconnect;
        n.interconnectBandwidth = target.interconnectBandwidth;
        n.nvswitchGeneration = target.nvswitchGeneration;
        n.maxPowerDrawKW = target.maxPowerDrawKW;
        n.powerSupplyKW = target.powerSupplyKW;
        n.maintenanceCost = target.maintenanceCost;
      }
    });
    events.emit("NODE_UPGRADED", this.nodeId, target.interconnect, cost);
  }
};
var UpgradeClusterStorageCommand = class {
  constructor(clusterId, targetStorageType) {
    this.clusterId = clusterId;
    this.targetStorageType = targetStorageType;
  }
  execute(state, events) {
    const current2 = state.read();
    const cluster = current2.clusters.find((c) => c.id === this.clusterId);
    if (!cluster) {
      events.emit("STORAGE_UPGRADE_REJECTED", { reason: "\u96C6\u7FA4\u4E0D\u5B58\u5728" });
      return;
    }
    const targetConfig = getStorageConfig(this.targetStorageType);
    if (!targetConfig) {
      events.emit("STORAGE_UPGRADE_REJECTED", { reason: "\u672A\u77E5\u5B58\u50A8\u7C7B\u578B" });
      return;
    }
    const currentIdx = STORAGE_CONFIGS.findIndex((s) => s.id === cluster.storageType);
    const targetIdx = STORAGE_CONFIGS.findIndex((s) => s.id === this.targetStorageType);
    if (targetIdx <= currentIdx) {
      events.emit("STORAGE_UPGRADE_REJECTED", { reason: "\u76EE\u6807\u5B58\u50A8\u7EA7\u522B\u4E0D\u9AD8\u4E8E\u5F53\u524D" });
      return;
    }
    const cost = targetConfig.upgradeCostPerNode * cluster.nodes.length;
    const funds = current2.resources["funds"] ?? 0;
    if (funds < cost) {
      events.emit("STORAGE_UPGRADE_REJECTED", { reason: "\u8D44\u91D1\u4E0D\u8DB3", cost });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] -= cost;
      const c = draft.clusters.find((x) => x.id === this.clusterId);
      if (c) {
        c.storageType = this.targetStorageType;
        c.storageIO = targetConfig.io;
        c.storageCapacity = targetConfig.capacity;
        c.storageCostPerDay = targetConfig.costPerDay;
      }
    });
    events.emit("STORAGE_UPGRADED", this.clusterId, this.targetStorageType, cost);
  }
};
var MaintainDataCenterCommand = class {
  constructor(dcId) {
    this.dcId = dcId;
  }
  execute(state, events) {
    const current2 = state.read();
    const dc = current2.dataCenters.find((d) => d.id === this.dcId);
    if (!dc) {
      events.emit("DC_MAINTAIN_REJECTED", { reason: "\u6570\u636E\u4E2D\u5FC3\u4E0D\u5B58\u5728" });
      return;
    }
    const cost = 5e3;
    const funds = current2.resources["funds"] ?? 0;
    if (funds < cost) {
      events.emit("DC_MAINTAIN_REJECTED", { reason: "\u8D44\u91D1\u4E0D\u8DB3", cost });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] -= cost;
      const d = draft.dataCenters.find((x) => x.id === this.dcId);
      if (d) {
        d.currentPue = d.basePue;
        d.lastMaintenanceDay = draft.date;
      }
    });
    events.emit("DC_MAINTAINED", this.dcId);
  }
};
var RepairCardCommand = class {
  constructor(cardUid) {
    this.cardUid = cardUid;
  }
  execute(state, events) {
    const current2 = state.read();
    let modelId = null;
    let card;
    for (const key of Object.keys(current2.resourceMeta)) {
      const pool = current2.resourceMeta[key];
      if (!Array.isArray(pool)) continue;
      card = pool.find((c) => c.uid === this.cardUid);
      if (card) {
        modelId = key;
        break;
      }
    }
    if (!card || !modelId) {
      events.emit("CARD_REPAIR_REJECTED", { reason: "\u5361\u4E0D\u5B58\u5728" });
      return;
    }
    if (card.status === "online") {
      events.emit("CARD_REPAIR_REJECTED", { reason: "\u5361\u5DF2\u5728\u7EBF\uFF0C\u65E0\u9700\u4FEE\u590D" });
      return;
    }
    if (card.status === "broken") {
      events.emit("CARD_REPAIR_REJECTED", { reason: "\u5361\u5DF2\u62A5\u5E9F\uFF0C\u65E0\u6CD5\u4FEE\u590D" });
      return;
    }
    const spec = getCardSpec(modelId);
    if (!spec) return;
    const cost = Math.ceil(spec.unitCost * 0.2);
    const funds = current2.resources["funds"] ?? 0;
    if (funds < cost) {
      events.emit("CARD_REPAIR_REJECTED", { reason: "\u8D44\u91D1\u4E0D\u8DB3", cost });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] = Math.max(0, (draft.resources["funds"] ?? 0) - cost);
      const pool = draft.resourceMeta[modelId];
      if (Array.isArray(pool)) {
        const c = pool.find((x) => x.uid === this.cardUid);
        if (c) {
          c.status = "online";
          c.autoRecoverDay = void 0;
        }
      }
      draft.infraEventLog.push({
        date: draft.date,
        type: "CARD_REPAIRED",
        message: `\u8BA1\u7B97\u5361 ${card.uid.slice(-6)} \u5DF2\u4FEE\u590D`,
        severity: "info"
      });
      if (draft.infraEventLog.length > 100) {
        draft.infraEventLog = draft.infraEventLog.slice(-100);
      }
    });
    events.emit("CARD_REPAIRED", this.cardUid, modelId, cost);
  }
};
var ScrapCardCommand = class {
  constructor(cardUid) {
    this.cardUid = cardUid;
  }
  execute(state, events) {
    const current2 = state.read();
    let modelId = null;
    let card;
    for (const key of Object.keys(current2.resourceMeta)) {
      const pool = current2.resourceMeta[key];
      if (!Array.isArray(pool)) continue;
      card = pool.find((c) => c.uid === this.cardUid);
      if (card) {
        modelId = key;
        break;
      }
    }
    if (!card || !modelId) {
      events.emit("CARD_SCRAP_REJECTED", { reason: "\u5361\u4E0D\u5B58\u5728" });
      return;
    }
    const spec = getCardSpec(modelId);
    if (!spec) return;
    const salvage = Math.ceil(spec.unitCost * 0.05);
    state.update((draft) => {
      for (const project of draft.trainingProjects) {
        for (const [nodeId, uids] of Object.entries(project.nodeAssignments)) {
          if (uids.includes(this.cardUid)) {
            project.nodeAssignments[nodeId] = uids.filter((u) => u !== this.cardUid);
          }
        }
        for (const nodeId of Object.keys(project.nodeAssignments)) {
          if (project.nodeAssignments[nodeId].length === 0) {
            delete project.nodeAssignments[nodeId];
          }
        }
      }
      if (card.location) {
        const node = draft.serverNodes.find((n) => n.id === card.location);
        if (node) {
          node.installedCards = node.installedCards.filter((uid) => uid !== this.cardUid);
        }
      }
      const scrapPool = draft.resourceMeta[modelId];
      if (Array.isArray(scrapPool)) {
        draft.resourceMeta[modelId] = scrapPool.filter((c) => c.uid !== this.cardUid);
      }
      draft.resources[modelId] = (draft.resources[modelId] ?? 0) - 1;
      draft.resources["funds"] = Math.max(0, (draft.resources["funds"] ?? 0) + salvage);
      draft.infraEventLog.push({
        date: draft.date,
        type: "CARD_SCRAPPED",
        message: `\u8BA1\u7B97\u5361 ${card.uid.slice(-6)} \u5DF2\u62A5\u5E9F\uFF0C\u56DE\u6536 $${salvage}`,
        severity: "warning"
      });
      if (draft.infraEventLog.length > 100) {
        draft.infraEventLog = draft.infraEventLog.slice(-100);
      }
    });
    events.emit("CARD_SCRAPPED", this.cardUid, salvage);
  }
};
var RepairNodeCommand = class {
  constructor(nodeId) {
    this.nodeId = nodeId;
  }
  execute(state, events) {
    const current2 = state.read();
    const node = current2.serverNodes.find((n) => n.id === this.nodeId);
    if (!node) {
      events.emit("NODE_REPAIR_REJECTED", { reason: "\u8282\u70B9\u4E0D\u5B58\u5728" });
      return;
    }
    const cost = node.maintenanceCost * 10;
    const funds = current2.resources["funds"] ?? 0;
    if (funds < cost) {
      events.emit("NODE_REPAIR_REJECTED", { reason: "\u8D44\u91D1\u4E0D\u8DB3", cost });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] = Math.max(0, (draft.resources["funds"] ?? 0) - cost);
      const n = draft.serverNodes.find((x) => x.id === this.nodeId);
      if (n) {
        for (const cardUid of n.installedCards) {
          for (const modelId of Object.keys(draft.resourceMeta)) {
            const pool = draft.resourceMeta[modelId];
            if (!Array.isArray(pool)) continue;
            const card = pool.find((c) => c.uid === cardUid);
            if (card && card.status === "offline") {
              card.status = "online";
              card.autoRecoverDay = void 0;
            }
          }
        }
        n.reliability = n.baseReliability;
        n.lastMaintenanceDay = draft.date;
      }
      draft.infraEventLog.push({
        date: draft.date,
        type: "NODE_REPAIRED",
        message: `\u8282\u70B9 ${node.name} \u5DF2\u4FEE\u590D`,
        severity: "info"
      });
      if (draft.infraEventLog.length > 100) {
        draft.infraEventLog = draft.infraEventLog.slice(-100);
      }
    });
    events.emit("NODE_REPAIRED", this.nodeId, cost);
  }
};
var MaintainNodeCommand = class {
  constructor(nodeId) {
    this.nodeId = nodeId;
  }
  execute(state, events) {
    const current2 = state.read();
    const node = current2.serverNodes.find((n) => n.id === this.nodeId);
    if (!node) {
      events.emit("NODE_MAINTAIN_REJECTED", { reason: "\u8282\u70B9\u4E0D\u5B58\u5728" });
      return;
    }
    const cost = node.maintenanceCost * 5;
    const funds = current2.resources["funds"] ?? 0;
    if (funds < cost) {
      events.emit("NODE_MAINTAIN_REJECTED", { reason: "\u8D44\u91D1\u4E0D\u8DB3", cost });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] -= cost;
      const n = draft.serverNodes.find((x) => x.id === this.nodeId);
      if (n) {
        n.reliability = n.baseReliability;
        n.lastMaintenanceDay = draft.date;
      }
      draft.infraEventLog.push({
        date: draft.date,
        type: "NODE_MAINTAINED",
        message: `\u8282\u70B9 ${node.name} \u5DF2\u7EF4\u62A4\uFF0C\u53EF\u9760\u6027\u6062\u590D\u81F3 ${node.baseReliability}`,
        severity: "info"
      });
      if (draft.infraEventLog.length > 100) {
        draft.infraEventLog = draft.infraEventLog.slice(-100);
      }
    });
    events.emit("NODE_MAINTAINED", this.nodeId, cost);
  }
};

// ../../src/core/commands/LearnSkillCommand.ts
var LearnSkillCommand = class {
  constructor(employeeId, skillId) {
    this.employeeId = employeeId;
    this.skillId = skillId;
  }
  execute(state, events) {
    const current2 = state.read();
    const emp = current2.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit("LEARN_SKILL_REJECTED", {
        employeeId: this.employeeId,
        skillId: this.skillId,
        reason: "\u5458\u5DE5\u4E0D\u5B58\u5728"
      });
      return;
    }
    const roleCfg = ROLE_CONFIG[emp.role];
    if (!roleCfg.skillPool.includes(this.skillId)) {
      events.emit("LEARN_SKILL_REJECTED", {
        employeeId: this.employeeId,
        skillId: this.skillId,
        reason: "\u8BE5\u6280\u80FD\u4E0D\u5728\u5F53\u524D\u89D2\u8272\u7684\u6280\u80FD\u6C60\u4E2D"
      });
      return;
    }
    const skillCfg = SKILL_CONFIG[this.skillId];
    if (!skillCfg) {
      events.emit("LEARN_SKILL_REJECTED", {
        employeeId: this.employeeId,
        skillId: this.skillId,
        reason: "\u672A\u77E5\u6280\u80FD"
      });
      return;
    }
    const skill = emp.skills.find((s) => s.id === this.skillId);
    if (!skill) {
      events.emit("LEARN_SKILL_REJECTED", {
        employeeId: this.employeeId,
        skillId: this.skillId,
        reason: "\u5458\u5DE5\u4E0D\u6301\u6709\u8BE5\u6280\u80FD\u69FD"
      });
      return;
    }
    if (skill.unlocked) {
      events.emit("LEARN_SKILL_REJECTED", {
        employeeId: this.employeeId,
        skillId: this.skillId,
        reason: "\u6280\u80FD\u5DF2\u89E3\u9501"
      });
      return;
    }
    if (emp.skillPoints < skillCfg.cost) {
      events.emit("LEARN_SKILL_REJECTED", {
        employeeId: this.employeeId,
        skillId: this.skillId,
        reason: "\u6280\u80FD\u70B9\u4E0D\u8DB3",
        has: emp.skillPoints,
        need: skillCfg.cost
      });
      return;
    }
    state.update((draft) => {
      const target = draft.employees.find((e) => e.id === this.employeeId);
      if (!target) return;
      const targetSkill = target.skills.find((s) => s.id === this.skillId);
      if (!targetSkill) return;
      targetSkill.unlocked = true;
      target.skillPoints -= skillCfg.cost;
    });
    events.emit("SKILL_LEARNED", this.employeeId, this.skillId);
  }
};

// ../../src/core/commands/ManagementCommands.ts
var SwitchManagementModeCommand = class {
  constructor(targetMode) {
    this.targetMode = targetMode;
  }
  execute(state, events) {
    const current2 = state.read();
    if (current2.managementMode === this.targetMode) {
      events.emit("MANAGEMENT_MODE_SWITCH_FAILED", {
        reason: "same_mode",
        target: this.targetMode
      });
      return;
    }
    const daysSinceLast = current2.date - current2.managementModeChangedDay;
    if (daysSinceLast < MODE_SWITCH_COOLDOWN_DAYS) {
      events.emit("MANAGEMENT_MODE_SWITCH_FAILED", {
        reason: "cooldown",
        remainingDays: MODE_SWITCH_COOLDOWN_DAYS - daysSinceLast
      });
      return;
    }
    const coreManagers = current2.employees.filter(
      (e) => e.role === "manager" /* MANAGER */ && e.status !== "training"
    ).length;
    const cost = calcModeSwitchCost(this.targetMode, coreManagers);
    if ((current2.resources["funds"] ?? 0) < cost) {
      events.emit("MANAGEMENT_MODE_SWITCH_FAILED", {
        reason: "insufficient_funds",
        cost
      });
      return;
    }
    const fromMode = current2.managementMode;
    state.update((draft) => {
      draft.resources["funds"] = (draft.resources["funds"] ?? 0) - cost;
      draft.managementMode = this.targetMode;
      draft.managementModeChangedDay = draft.date;
    });
    events.emit("MANAGEMENT_MODE_SWITCHED", {
      from: fromMode,
      to: this.targetMode,
      cost
    });
  }
};
var AppointExecutiveCommand = class {
  constructor(role, employeeId) {
    this.role = role;
    this.employeeId = employeeId;
  }
  execute(state, events) {
    const current2 = state.read();
    const emp = current2.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit("EXECUTIVE_APPOINT_FAILED", {
        role: this.role,
        reason: "employee_not_found"
      });
      return;
    }
    const cfg = EXECUTIVE_CONFIGS[this.role];
    if (emp.level < cfg.minLevel) {
      events.emit("EXECUTIVE_APPOINT_FAILED", {
        role: this.role,
        reason: "level_too_low",
        required: cfg.minLevel,
        actual: emp.level
      });
      return;
    }
    if (emp.attributes.leadership < cfg.minLeadership) {
      events.emit("EXECUTIVE_APPOINT_FAILED", {
        role: this.role,
        reason: "leadership_too_low",
        required: cfg.minLeadership,
        actual: emp.attributes.leadership
      });
      return;
    }
    if (cfg.minCharisma > 0 && emp.attributes.charisma < cfg.minCharisma) {
      events.emit("EXECUTIVE_APPOINT_FAILED", {
        role: this.role,
        reason: "charisma_too_low",
        required: cfg.minCharisma,
        actual: emp.attributes.charisma
      });
      return;
    }
    for (const r of EXECUTIVE_ROLES) {
      const k = `${r}Id`;
      if (current2.executives[k] === this.employeeId) {
        events.emit("EXECUTIVE_APPOINT_FAILED", {
          role: this.role,
          reason: "already_executive"
        });
        return;
      }
    }
    const slotKey = `${this.role}Id`;
    const previousId = current2.executives[slotKey];
    state.update((draft) => {
      draft.executives[slotKey] = this.employeeId;
    });
    events.emit("EXECUTIVE_APPOINTED", {
      role: this.role,
      employeeId: this.employeeId,
      previousId
    });
  }
};
var DismissExecutiveCommand = class {
  constructor(role) {
    this.role = role;
  }
  execute(state, events) {
    const current2 = state.read();
    const slotKey = `${this.role}Id`;
    const previousId = current2.executives[slotKey];
    if (!previousId) {
      events.emit("EXECUTIVE_DISMISS_FAILED", {
        role: this.role,
        reason: "slot_empty"
      });
      return;
    }
    state.update((draft) => {
      draft.executives[slotKey] = null;
    });
    events.emit("EXECUTIVE_DISMISSED", {
      role: this.role,
      previousId
    });
  }
};

// ../../src/core/commands/OpenSourceCommands.ts
var AdoptOpenSourceCommand = class {
  constructor(offerId) {
    this.offerId = offerId;
  }
  execute(state, events) {
    const current2 = state.read();
    const offer = current2.openSourceOffers.find((o) => o.id === this.offerId);
    if (!offer) {
      events.emit("OPEN_SOURCE_REJECTED", { reason: "\u8981\u7EA6\u4E0D\u5B58\u5728" });
      return;
    }
    if (offer.adoptedDay !== void 0) {
      events.emit("OPEN_SOURCE_REJECTED", { reason: "\u5DF2\u91C7\u7EB3" });
      return;
    }
    if (current2.date > offer.expiresDay) {
      events.emit("OPEN_SOURCE_REJECTED", { reason: "\u5DF2\u8FC7\u671F" });
      return;
    }
    const funds = current2.resources["funds"] ?? 0;
    if (funds < offer.adoptionCost) {
      events.emit("OPEN_SOURCE_REJECTED", { reason: "\u8D44\u91D1\u4E0D\u8DB3" });
      return;
    }
    const isUniqueTech = !!OPEN_SOURCE_TECH_POOL.find((t) => t.id === offer.techId) && !IDEA_TECH_MAP[offer.techId];
    if (isUniqueTech && !canAcceptUniqueTechs(current2, 1)) {
      const used = getUniqueTechCount(current2);
      const max = getMaxUniqueTechSlots(current2);
      events.emit("OPEN_SOURCE_REJECTED", {
        reason: `\u72EC\u6709\u6280\u672F\u69FD\u4F4D\u5DF2\u6EE1 (${used}/${max})`
      });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] = (draft.resources["funds"] ?? 0) - offer.adoptionCost;
      const target = draft.openSourceOffers.find((o) => o.id === this.offerId);
      if (target) target.adoptedDay = draft.date;
      const poolNode = OPEN_SOURCE_TECH_POOL.find((t) => t.id === offer.techId);
      if (poolNode && !IDEA_TECH_MAP[poolNode.id]) {
        IDEA_TECH_MAP[poolNode.id] = poolNode;
        draft.acceptedIdeaTechs.push(poolNode);
      }
      const existing = draft.techMaturity[offer.techId] ?? 0;
      draft.techMaturity[offer.techId] = Math.max(existing, offer.initialMaturity);
    });
    events.emit("OPEN_SOURCE_ADOPTED", offer);
  }
};

// ../../src/core/commands/OperationsCommands.ts
var RaiseFundingCommand = class {
  constructor(params) {
    this.params = params;
  }
  execute(state, events) {
    const current2 = state.read();
    const annualRevenue = (current2.operations?.dailyRevenue ?? 0) * 365 / 1e6;
    const publishedModels = current2.models.filter((m) => m.published);
    const bestCap = publishedModels.length > 0 ? Math.max(...publishedModels.map((m) => m.baseScore)) : 0;
    const valuation = calcValuation({
      annualRevenue,
      bestCapability: bestCap,
      headquartersRegionId: current2.headquartersRegionId,
      trainingProjects: current2.trainingProjects.map((p) => ({
        computeTotal: p.computeTotal,
        computeRemaining: p.computeRemaining,
        paramCount: p.paramCount
      })),
      // BUG-16 修复：估值包含云算力，让云租赁在融资时也有战略价值
      totalComputeTFLOPS: (current2.resources["compute_power"] ?? 0) + getActiveCloudTFLOPS(current2),
      employeeCount: current2.employees.length
    });
    const typeMultiplier = {
      seed: 0.03 + Math.random() * 0.04,
      // 种子轮：3-7%（低额度，早期专用）
      strategic: 0.05 + Math.random() * 0.1,
      venture_capital: 0.1 + Math.random() * 0.2,
      government: 0.03 + Math.random() * 0.05,
      ipo: 0.2 + Math.random() * 0.2
    };
    const amount = valuation * typeMultiplier[this.params.type];
    state.update((draft) => {
      if (!draft.operations) {
        draft.operations = createDefaultOperations();
      }
      draft.fundingRounds.push({
        id: `funding-${draft.date}-${this.params.type}-${Math.random().toString(36).slice(2, 6)}`,
        type: this.params.type,
        investorName: this.params.investorName,
        amount,
        valuationAtRound: valuation,
        usedAmount: 0,
        terms: {
          computeDiscount: this.params.terms.computeDiscount,
          exclusivityRequired: this.params.terms.exclusivityRequired,
          techAlignment: this.params.terms.techAlignment,
          vamRevenueTarget: this.params.terms.vamRevenueTarget,
          vamUserTarget: this.params.terms.vamUserTarget,
          vamDeadlineDays: this.params.terms.vamDeadlineDays,
          vamDilutionPercent: this.params.terms.vamDilutionPercent,
          restrictedMarkets: this.params.terms.restrictedMarkets,
          securityReviewRequired: this.params.terms.securityReviewRequired,
          stockPrice: this.params.terms.stockPrice ?? this.params.terms.ipoPrice,
          ipoPrice: this.params.terms.ipoPrice,
          shortSellRisk: this.params.terms.shortSellRisk ?? 0.01,
          // 设计-15：IPO 时根据发行价和融资金额推算初始流通股数
          sharesOutstanding: this.params.type === "ipo" && (this.params.terms.ipoPrice ?? this.params.terms.stockPrice) ? Math.round(amount * 1e6 / (this.params.terms.ipoPrice ?? this.params.terms.stockPrice)) : void 0,
          boardSeats: this.params.terms.boardSeats
        },
        completedAt: draft.date,
        active: true
      });
      draft.resources["funds"] = (draft.resources["funds"] ?? 0) + amount * 1e6;
    });
    events.emit("FUNDING_COMPLETED", this.params.type, this.params.investorName, amount);
  }
};
var SetTokenPricingCommand = class {
  constructor(pricePerMillion, inferenceAllocation) {
    this.pricePerMillion = pricePerMillion;
    this.inferenceAllocation = inferenceAllocation;
  }
  execute(state, events) {
    const safePrice = Math.max(0, this.pricePerMillion);
    const safeAlloc = Math.max(0, Math.min(1, this.inferenceAllocation));
    state.update((draft) => {
      if (!draft.operations) {
        draft.operations = createDefaultOperations();
      }
      draft.operations.tokenPricing.pricePerMillion = safePrice;
      draft.operations.tokenPricing.inferenceAllocation = safeAlloc;
    });
    events.emit("TOKEN_PRICING_UPDATED", safePrice, safeAlloc);
  }
};
var SetDowngradeLevelCommand = class {
  constructor(level) {
    this.level = level;
  }
  execute(state, events) {
    state.update((draft) => {
      if (!draft.operations) {
        draft.operations = createDefaultOperations();
      }
      draft.operations.deception.downgradeLevel = Math.max(0, Math.min(3, this.level));
      draft.operations.deception.detectionProbability = 0.02 * this.level;
      draft.riskState.employeeMorale = Math.max(0, draft.riskState.employeeMorale - this.level * 3);
    });
    events.emit("DOWNGRADE_CHANGED", this.level);
  }
};
var ToggleStealUserDataCommand = class {
  constructor(enable) {
    this.enable = enable;
  }
  execute(state, events) {
    state.update((draft) => {
      if (!draft.operations) {
        draft.operations = createDefaultOperations();
      }
      draft.operations.deception.stealUserData = this.enable;
      if (this.enable) {
        draft.operations.deception.detectionProbability += 0.05;
      } else {
        draft.operations.deception.detectionProbability = Math.max(0.02 * draft.operations.deception.downgradeLevel, draft.operations.deception.detectionProbability - 0.05);
      }
    });
    events.emit("DATA_THEFT_TOGGLED", this.enable);
  }
};
var ToggleSkipSafetyCommand = class {
  constructor(enable) {
    this.enable = enable;
  }
  execute(state, events) {
    state.update((draft) => {
      if (!draft.operations) {
        draft.operations = createDefaultOperations();
      }
      draft.operations.deception.skipSafetyTesting = this.enable;
      if (this.enable) {
        draft.operations.deception.detectionProbability += 0.03;
      } else {
        draft.operations.deception.detectionProbability = Math.max(0.02 * draft.operations.deception.downgradeLevel, draft.operations.deception.detectionProbability - 0.03);
      }
    });
    events.emit("SAFETY_TOGGLED", this.enable);
  }
};
var RespondToMissionCommand = class {
  constructor(missionId, action) {
    this.missionId = missionId;
    this.action = action;
  }
  execute(state, events) {
    state.update((draft) => {
      if (!draft.operations) return;
      const mission = draft.operations.boardMissions.find((m) => m.id === this.missionId);
      if (!mission || mission.status !== "pending") return;
      if (this.action === "accept") {
        mission.status = "accepted";
      } else {
        mission.status = "rejected";
        draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 3);
        draft.riskState.employeeMorale = Math.max(0, draft.riskState.employeeMorale - 5);
      }
    });
    events.emit("MISSION_RESPONSE", this.missionId, this.action);
  }
};
var SECONDARY_OFFER_MAX_RATIO = 0.2;
var SECONDARY_OFFER_DISCOUNT = 0.05;
var IssueSecondaryOfferingCommand = class {
  /**
   * @param amountMillions 希望筹集的资金（百万美元）
   */
  constructor(amountMillions) {
    this.amountMillions = amountMillions;
  }
  execute(state, events) {
    const current2 = state.read();
    const ipoIdx = current2.fundingRounds.findIndex((r) => r.type === "ipo" && r.active);
    if (ipoIdx < 0) {
      events.emit("SECONDARY_OFFER_REJECTED", { reason: "\u5C1A\u672A IPO\uFF0C\u65E0\u6CD5\u589E\u53D1" });
      return;
    }
    const ipo = current2.fundingRounds[ipoIdx];
    if (!ipo.terms.stockPrice || !ipo.terms.sharesOutstanding) {
      events.emit("SECONDARY_OFFER_REJECTED", { reason: "IPO \u6570\u636E\u5F02\u5E38\uFF0C\u7F3A\u5C11\u80A1\u4EF7\u6216\u6D41\u901A\u80A1\u4FE1\u606F" });
      return;
    }
    if (this.amountMillions <= 0) {
      events.emit("SECONDARY_OFFER_REJECTED", { reason: "\u589E\u53D1\u91D1\u989D\u5FC5\u987B > 0" });
      return;
    }
    const price = ipo.terms.stockPrice;
    const shares = ipo.terms.sharesOutstanding;
    const newShares = Math.round(this.amountMillions * 1e6 / price);
    if (newShares > shares * SECONDARY_OFFER_MAX_RATIO) {
      events.emit("SECONDARY_OFFER_REJECTED", {
        reason: `\u589E\u53D1\u80A1\u6570 ${newShares.toLocaleString()} \u8D85\u8FC7\u6D41\u901A\u80A1\u7684 ${SECONDARY_OFFER_MAX_RATIO * 100}% \u4E0A\u9650`
      });
      return;
    }
    const proceeds = newShares * price * (1 - SECONDARY_OFFER_DISCOUNT);
    const priceDropRatio = newShares / (shares + newShares) * 0.5;
    const newPrice = Math.max(0.1, price * (1 - priceDropRatio));
    state.update((draft) => {
      draft.resources["funds"] = (draft.resources["funds"] ?? 0) + proceeds;
      draft.fundingRounds[ipoIdx].terms.sharesOutstanding = shares + newShares;
      draft.fundingRounds[ipoIdx].terms.stockPrice = newPrice;
    });
    events.emit(
      "SECONDARY_OFFER_COMPLETED",
      newShares,
      proceeds,
      newPrice
    );
  }
};
var BUYBACK_MAX_RATIO = 0.1;
var BuybackStockCommand = class {
  /**
   * @param amountMillions 回购预算（百万美元）
   */
  constructor(amountMillions) {
    this.amountMillions = amountMillions;
  }
  execute(state, events) {
    const current2 = state.read();
    const ipoIdx = current2.fundingRounds.findIndex((r) => r.type === "ipo" && r.active);
    if (ipoIdx < 0) {
      events.emit("BUYBACK_REJECTED", { reason: "\u5C1A\u672A IPO\uFF0C\u65E0\u6CD5\u56DE\u8D2D" });
      return;
    }
    const ipo = current2.fundingRounds[ipoIdx];
    if (!ipo.terms.stockPrice || !ipo.terms.sharesOutstanding) {
      events.emit("BUYBACK_REJECTED", { reason: "IPO \u6570\u636E\u5F02\u5E38\uFF0C\u7F3A\u5C11\u80A1\u4EF7\u6216\u6D41\u901A\u80A1\u4FE1\u606F" });
      return;
    }
    if (this.amountMillions <= 0) {
      events.emit("BUYBACK_REJECTED", { reason: "\u56DE\u8D2D\u91D1\u989D\u5FC5\u987B > 0" });
      return;
    }
    const price = ipo.terms.stockPrice;
    const shares = ipo.terms.sharesOutstanding;
    const cost = this.amountMillions * 1e6;
    const funds = current2.resources["funds"] ?? 0;
    if (funds < cost) {
      events.emit("BUYBACK_REJECTED", { reason: "\u8D44\u91D1\u4E0D\u8DB3", cost, funds });
      return;
    }
    const buybackShares = Math.round(cost / price);
    if (buybackShares > shares * BUYBACK_MAX_RATIO) {
      events.emit("BUYBACK_REJECTED", {
        reason: `\u56DE\u8D2D\u80A1\u6570 ${buybackShares.toLocaleString()} \u8D85\u8FC7\u6D41\u901A\u80A1\u7684 ${BUYBACK_MAX_RATIO * 100}% \u4E0A\u9650`
      });
      return;
    }
    if (buybackShares >= shares) {
      events.emit("BUYBACK_REJECTED", { reason: "\u56DE\u8D2D\u540E\u6D41\u901A\u80A1\u4E0D\u5F97\u4E3A 0" });
      return;
    }
    const priceGainRatio = buybackShares / shares * 0.6;
    const newPrice = price * (1 + priceGainRatio);
    state.update((draft) => {
      draft.resources["funds"] = (draft.resources["funds"] ?? 0) - cost;
      draft.fundingRounds[ipoIdx].terms.sharesOutstanding = shares - buybackShares;
      draft.fundingRounds[ipoIdx].terms.stockPrice = newPrice;
    });
    events.emit(
      "BUYBACK_COMPLETED",
      buybackShares,
      cost,
      newPrice
    );
  }
};
function createDefaultOperations() {
  return {
    dailyRevenue: 0,
    tokenRevenue: 0,
    userChurnRate: 7e-4,
    markets: [],
    tokenPricing: {
      pricePerMillion: 0.01,
      inferenceAllocation: 0.1,
      // 设计 #2：默认 10% 算力用于推理，提供早期小额收入
      qualityDowngrade: 0
    },
    deception: {
      downgradeLevel: 0,
      stealUserData: false,
      skipSafetyTesting: false,
      detectionProbability: 0,
      totalDeceptions: 0
    },
    boardMissions: []
  };
}

// ../../src/core/commands/PromoteEmployeeCommand.ts
var PROMOTE_DAY_KEY = "lastBonusDay";
var PromoteEmployeeCommand = class {
  constructor(employeeId) {
    this.employeeId = employeeId;
  }
  execute(state, events) {
    const current2 = state.read();
    const emp = current2.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit("PROMOTE_REJECTED", { reason: "\u5458\u5DE5\u4E0D\u5B58\u5728" });
      return;
    }
    if (emp.level >= 10) {
      events.emit("PROMOTE_REJECTED", { reason: "\u5DF2\u8FBE\u6700\u9AD8\u7B49\u7EA7" });
      return;
    }
    const requiredExp = experienceForLevel(emp.level) * PROMOTE_EXP_RATIO;
    if (emp.experience < requiredExp) {
      events.emit("PROMOTE_REJECTED", {
        reason: `\u7ECF\u9A8C\u4E0D\u8DB3\uFF0C\u9700 ${Math.ceil(requiredExp)}\uFF0C\u5F53\u524D ${Math.floor(emp.experience)}`
      });
      return;
    }
    const perf = emp.lastPerformance;
    if (!perf) {
      events.emit("PROMOTE_REJECTED", { reason: "\u5C1A\u65E0\u7EE9\u6548\u8BB0\u5F55" });
      return;
    }
    const gradeOrder = { S: 4, A: 3, B: 2, C: 1 };
    if (gradeOrder[perf.grade] < gradeOrder[PROMOTE_MIN_GRADE]) {
      events.emit("PROMOTE_REJECTED", {
        reason: `\u7EE9\u6548\u4E0D\u8DB3\uFF0C\u9700 ${PROMOTE_MIN_GRADE} \u7EA7\u4EE5\u4E0A\uFF0C\u5F53\u524D ${perf.grade} \u7EA7`
      });
      return;
    }
    const lastPromote = emp[PROMOTE_DAY_KEY] ?? -999;
    if (current2.date - lastPromote < PROMOTE_COOLDOWN_DAYS) {
      const remain = PROMOTE_COOLDOWN_DAYS - (current2.date - lastPromote);
      events.emit("PROMOTE_REJECTED", {
        reason: `\u51B7\u5374\u4E2D\uFF0C\u5269\u4F59 ${remain} \u5929`
      });
      return;
    }
    const newLevel = emp.level + 1;
    const hqRegionId = current2.headquartersRegionId;
    const hqRegion = hqRegionId ? REGIONS.find((r) => r.id === hqRegionId) ?? null : null;
    const newSalary = calcSalaryForLevel(emp.role, newLevel, hqRegion);
    const oldLevel = emp.level;
    const oldSalary = emp.salary;
    state.update((draft) => {
      const target = draft.employees.find((e) => e.id === this.employeeId);
      if (!target) return;
      target.level = newLevel;
      target.salary = newSalary;
      target.skillPoints += PROMOTE_SKILL_POINT_GAIN;
      target.loyalty = Math.min(100, target.loyalty + 10);
      target[PROMOTE_DAY_KEY] = draft.date;
    });
    events.emit("EMPLOYEE_PROMOTED", {
      employeeId: this.employeeId,
      oldLevel,
      newLevel,
      oldSalary,
      newSalary,
      skillPointGain: PROMOTE_SKILL_POINT_GAIN
    });
  }
};

// ../../src/core/commands/PublishModelCommand.ts
var PublishModelCommand = class {
  constructor(modelId) {
    this.modelId = modelId;
  }
  execute(state, events) {
    const current2 = state.read();
    const model = current2.models.find((m) => m.id === this.modelId);
    if (!model) {
      events.emit("PUBLISH_MODEL_FAILED", this.modelId, "\u6A21\u578B\u4E0D\u5B58\u5728");
      return;
    }
    if (model.published) {
      events.emit("PUBLISH_MODEL_FAILED", this.modelId, "\u6A21\u578B\u5DF2\u53D1\u5E03");
      return;
    }
    if (model.completedAt < 0) {
      events.emit("PUBLISH_MODEL_FAILED", this.modelId, "\u6A21\u578B\u5C1A\u672A\u8BAD\u7EC3\u5B8C\u6210");
      return;
    }
    state.update((draft) => {
      const m = draft.models.find((x) => x.id === this.modelId);
      if (!m) return;
      m.published = true;
      m.daysSincePublished = 0;
    });
    events.emit("MODEL_PUBLISHED", this.modelId, model.name, model.baseScore);
  }
};
var UnpublishModelCommand = class {
  constructor(modelId) {
    this.modelId = modelId;
  }
  execute(state, events) {
    const current2 = state.read();
    const model = current2.models.find((m) => m.id === this.modelId);
    if (!model) {
      events.emit("UNPUBLISH_MODEL_FAILED", this.modelId, "\u6A21\u578B\u4E0D\u5B58\u5728");
      return;
    }
    if (!model.published) {
      events.emit("UNPUBLISH_MODEL_FAILED", this.modelId, "\u6A21\u578B\u672A\u53D1\u5E03");
      return;
    }
    state.update((draft) => {
      const m = draft.models.find((x) => x.id === this.modelId);
      if (!m) return;
      m.published = false;
      draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 5);
    });
    events.emit("MODEL_UNPUBLISHED", this.modelId, model.name);
  }
};
var SetModelResearchUsageCommand = class {
  constructor(modelId, enabled) {
    this.modelId = modelId;
    this.enabled = enabled;
  }
  execute(state, events) {
    const current2 = state.read();
    const model = current2.models.find((m) => m.id === this.modelId);
    if (!model) {
      events.emit("MODEL_RESEARCH_USAGE_FAILED", this.modelId, "\u6A21\u578B\u4E0D\u5B58\u5728");
      return;
    }
    state.update((draft) => {
      const m = draft.models.find((x) => x.id === this.modelId);
      if (!m) return;
      m.usedInResearch = this.enabled;
    });
    events.emit(
      this.enabled ? "MODEL_RESEARCH_ENABLED" : "MODEL_RESEARCH_DISABLED",
      this.modelId,
      model.name
    );
  }
};

// ../../src/core/commands/PurchaseHardwareCommand.ts
var PurchaseHardwareCommand = class {
  constructor(modelId, quantity) {
    this.modelId = modelId;
    this.quantity = quantity;
  }
  execute(state, events) {
    if (this.quantity <= 0) {
      events.emit("PURCHASE_REJECTED", { modelId: this.modelId, reason: "\u6570\u91CF\u5FC5\u987B\u5927\u4E8E 0" });
      return;
    }
    const spec = getCardSpec(this.modelId);
    if (!spec) {
      events.emit("PURCHASE_REJECTED", { modelId: this.modelId, reason: "\u672A\u77E5\u786C\u4EF6\u578B\u53F7" });
      return;
    }
    if (spec.releaseDate) {
      const current2 = state.read();
      const currentDateStr = formatGameDate(current2.startDate, current2.date);
      if (currentDateStr < spec.releaseDate) {
        events.emit("PURCHASE_REJECTED", {
          modelId: this.modelId,
          reason: `${spec.name} \u5C1A\u672A\u53D1\u5E03\uFF08\u53D1\u5E03\u65E5\u671F ${spec.releaseDate}\uFF09`
        });
        return;
      }
    }
    const totalCost = spec.unitCost * this.quantity;
    const funds = state.getResource("funds");
    if (funds < totalCost) {
      events.emit("PURCHASE_REJECTED", {
        modelId: this.modelId,
        quantity: this.quantity,
        totalCost,
        funds,
        reason: "\u8D44\u91D1\u4E0D\u8DB3"
      });
      return;
    }
    state.addResource("funds", -totalCost);
    const today = state.read().date;
    const order = {
      // S3-1 修复：原 Date.now()+Math.random 同毫秒高频采购可能碰撞。改用 crypto.randomUUID。
      id: `order-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`,
      modelId: this.modelId,
      quantity: this.quantity,
      deliveryDay: today + spec.deliveryDays,
      createdAt: today
    };
    state.update((draft) => {
      draft.pendingOrders.push(order);
    });
    events.emit("PURCHASE_ORDERED", order, totalCost);
  }
};

// ../../src/core/commands/RegionCommands.ts
function generateName2(regionId) {
  const region = REGION_MAP[regionId];
  const langs = region?.primaryLanguages ?? ["en"];
  const isChinese = langs.some((l) => l.startsWith("zh"));
  if (isChinese) {
    const surnames = ["\u674E", "\u738B", "\u5F20", "\u5218", "\u9648", "\u6768", "\u8D75", "\u9EC4", "\u5468", "\u5434", "\u5F90", "\u5B59", "\u9A6C", "\u6731", "\u80E1"];
    const givenNames = ["\u4F1F", "\u82B3", "\u5A1C", "\u654F", "\u9759", "\u4E3D", "\u5F3A", "\u78CA", "\u519B", "\u6D0B", "\u52C7", "\u8273", "\u6770", "\u6D9B", "\u660E", "\u8D85", "\u971E", "\u5E73", "\u521A", "\u6842\u82F1"];
    return `${surnames[Math.floor(Math.random() * surnames.length)]}${givenNames[Math.floor(Math.random() * givenNames.length)]}`;
  }
  const firstNames = ["James", "John", "Robert", "Michael", "William", "David", "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Thomas", "Christopher", "Daniel", "Matthew", "Emily"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson"];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}
var SetHeadquartersCommand = class {
  constructor(regionId, preset) {
    this.regionId = regionId;
    this.preset = preset;
  }
  execute(state, events) {
    const region = REGION_MAP[this.regionId];
    if (!region) return;
    const specMap = new Map(HARDWARE_SPECS.map((s) => [s.resourceId, s]));
    state.update((draft) => {
      draft.headquartersRegionId = this.regionId;
      draft.operatingRegionIds = [this.regionId];
      draft.publishedRegions = [this.regionId];
      if (!draft.operations) {
        draft.operations = createDefaultOperations();
      }
      const totalCardCount = this.preset.cards.reduce((s, c) => s + c.count, 0);
      const nodeCount = Math.max(1, Math.ceil(totalCardCount / 8));
      const nodeIds = [];
      for (let i = 0; i < nodeCount; i++) {
        nodeIds.push(`node-initial-${i}`);
      }
      draft.dataCenters = [{
        id: "dc-initial",
        name: "\u521D\u59CB\u6570\u636E\u4E2D\u5FC3",
        location: region.name,
        maxPowerMW: Math.max(0.1, nodeCount * 0.05),
        // 按节点数扩展电力容量
        usedPowerMW: 0,
        coolingType: "air",
        pue: 1.2,
        basePue: 1.2,
        currentPue: 1.2,
        clusters: ["cluster-initial"],
        buildCost: 5e4,
        maintenanceCostPerDay: 200,
        powerCostPerKWh: 0.08 + region.energyCostIndex * 1e-3,
        builtAt: draft.date,
        lastMaintenanceDay: draft.date
      }];
      draft.clusters = [{
        id: "cluster-initial",
        name: "\u521D\u59CB\u8BAD\u7EC3\u96C6\u7FA4",
        nodes: nodeIds,
        network: "InfiniBand HDR",
        switchCapacity: 200,
        networkBandwidth: 200,
        networkTopology: "fat_tree",
        maxNodes: 16,
        maxTPDegree: 8,
        allReduceBandwidth: 200,
        parallelEfficiencyBase: 0.95,
        buildCost: 3e4,
        operationalCostPerDay: 150,
        utilizationBonus: 1,
        baseUtilizationBonus: 1,
        dataCenterId: "dc-initial",
        storageType: "nvme_raid",
        storageIO: 10,
        storageCapacity: 100,
        storageCostPerDay: 50,
        createdAt: draft.date
      }];
      draft.serverNodes = nodeIds.map((nid, i) => ({
        id: nid,
        name: `\u8BAD\u7EC3\u8282\u70B9 ${i + 1}`,
        slotCount: 8,
        installedCards: [],
        interconnect: "NVLink3",
        interconnectBandwidth: 600,
        powerSupplyKW: 4,
        maxPowerDrawKW: 3.2,
        nvswitchGeneration: 1,
        reliability: 95,
        baseReliability: 95,
        nodeType: "hgx",
        cost: 8e4,
        maintenanceCost: 100,
        clusterId: "cluster-initial",
        builtAt: draft.date,
        lastMaintenanceDay: draft.date
      }));
      const baseFunds = draft.resources["funds"] ?? 1e6;
      draft.resources["funds"] = baseFunds + this.preset.bonusFunds;
      let totalTFlops = 0;
      let cardIdx = 0;
      for (const card of this.preset.cards) {
        const spec = specMap.get(card.modelId);
        if (!spec) continue;
        draft.resources[card.modelId] = (draft.resources[card.modelId] ?? 0) + card.count;
        const rawPool = draft.resourceMeta[card.modelId];
        const pool = Array.isArray(rawPool) ? rawPool : [];
        for (let i = 0; i < card.count; i++) {
          const targetNode = draft.serverNodes[cardIdx % nodeCount];
          const uid = `${card.modelId}-init-${cardIdx}`;
          const inst = {
            uid,
            modelId: card.modelId,
            status: "online",
            age: 0,
            assignedProjectId: null,
            purchasedAt: 0,
            location: targetNode.id
          };
          pool.push(inst);
          targetNode.installedCards.push(uid);
          totalTFlops += spec.tflopsPerCard;
          cardIdx++;
        }
        draft.resourceMeta[card.modelId] = pool;
      }
      draft.resources["compute_power"] = totalTFlops;
      const baseSalaryMultiplier = 0.5 + region.talentIndex / 100 * 0.5;
      const roleBaseSalary = {
        ["researcher" /* RESEARCHER */]: 12e4,
        ["data_engineer" /* DATA_ENGINEER */]: 8e4,
        ["system_engineer" /* SYSTEM_ENGINEER */]: 9e4,
        ["product_manager" /* PRODUCT_MANAGER */]: 1e5,
        ["legal_pr" /* LEGAL_PR */]: 85e3,
        ["manager" /* MANAGER */]: 15e4
      };
      const employees = [];
      let empIdx = 0;
      for (const empCfg of this.preset.employees) {
        for (let i = 0; i < empCfg.count; i++) {
          const empId = `emp-init-${empIdx++}`;
          employees.push({
            id: empId,
            name: generateName2(this.regionId),
            role: empCfg.role,
            status: "idle",
            level: empCfg.level,
            experience: 0,
            skillPoints: 0,
            skills: [],
            salary: Math.round(roleBaseSalary[empCfg.role] * baseSalaryMultiplier),
            loyalty: 75,
            fatigue: 0,
            hireDay: draft.date,
            attributes: generateCandidateAttributes(
              ROLE_CONFIG[empCfg.role].displayName === "\u7814\u7A76\u5458" ? 75 : 65,
              ROLE_CONFIG[empCfg.role].attributeWeights,
              empCfg.level
            ),
            departmentId: null,
            trainingId: null,
            hasEquity: false,
            equityGrantedDay: null,
            lastBonusDay: null,
            monthlyWorkDays: 0,
            monthlyContribution: 0,
            lastPerformance: null
          });
        }
      }
      draft.employees = employees;
      for (const emp of employees) {
        const deptType = Object.entries(DEPARTMENT_ROLE_MAP).find(
          ([, role]) => role === emp.role
        )?.[0];
        if (deptType) {
          const dept = draft.departments.find((d) => d.type === deptType);
          if (dept) {
            dept.memberIds.push(emp.id);
            emp.departmentId = dept.id;
          }
        }
      }
    });
    events.emit("HEADQUARTERS_SET", this.regionId, region.name);
  }
};
var EnterRegionCommand = class {
  constructor(regionId) {
    this.regionId = regionId;
  }
  execute(state, events) {
    const current2 = state.read();
    const region = REGION_MAP[this.regionId];
    if (!region) return;
    if (current2.operatingRegionIds.includes(this.regionId)) return;
    const entryCost = 1e5 + region.marketEntryDifficulty * 5e4;
    if (current2.resources["funds"] < entryCost) {
      events.emit("REGION_ENTRY_FAILED", this.regionId, "\u8D44\u91D1\u4E0D\u8DB3");
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] -= entryCost;
      draft.operatingRegionIds = [...draft.operatingRegionIds, this.regionId];
    });
    events.emit("REGION_ENTERED", this.regionId, region.name);
  }
};
var PublishInRegionCommand = class {
  constructor(regionId) {
    this.regionId = regionId;
  }
  execute(state, events) {
    const current2 = state.read();
    const region = REGION_MAP[this.regionId];
    if (!region) return;
    if (current2.publishedRegions.includes(this.regionId)) return;
    if (!current2.operatingRegionIds.includes(this.regionId)) {
      events.emit("PUBLISH_FAILED", this.regionId, "\u5C1A\u672A\u8FDB\u5165\u8BE5\u5730\u533A");
      return;
    }
    state.update((draft) => {
      draft.publishedRegions = [...draft.publishedRegions, this.regionId];
    });
    events.emit("REGION_PUBLISHED", this.regionId, region.name);
  }
};

// ../../src/core/config/cloudProviders.ts
var CLOUD_PROVIDERS = [
  {
    id: "nimbus",
    name: "Nimbus Cloud",
    description: "\u5168\u7403\u6700\u5927\u7684\u4E91\u8BA1\u7B97\u5E73\u53F0\uFF0CGPU \u5B9E\u4F8B\u4E30\u5BCC\uFF0C\u8986\u76D6\u6700\u5E7F",
    basePricePerTFLOPSDay: 0.12,
    unitTFLOPS: 100,
    minRentalDays: 7,
    maxRentalDays: 365
  },
  {
    id: "stratus",
    name: "Stratus AI",
    description: "TPU \u4E13\u7CBE\uFF0C\u8BAD\u7EC3\u4F18\u5316\u51FA\u8272\uFF0C\u4EF7\u683C\u7565\u4F4E\u4F46\u4F9B\u5E94\u6709\u9650",
    basePricePerTFLOPSDay: 0.1,
    unitTFLOPS: 200,
    minRentalDays: 14,
    maxRentalDays: 180
  },
  {
    id: "cirrus",
    name: "Cirrus Compute",
    description: "\u4F01\u4E1A\u7EA7\u6DF7\u5408\u4E91\uFF0CGPU + FPGA \u65B9\u6848\uFF0C\u4EF7\u683C\u8F83\u9AD8",
    basePricePerTFLOPSDay: 0.14,
    unitTFLOPS: 150,
    minRentalDays: 7,
    maxRentalDays: 365
  },
  {
    id: "nova",
    name: "Nova Cloud",
    description: "\u65B0\u5174 AI \u8BAD\u7EC3\u4E91\uFF0C\u4E13\u6CE8\u5927\u6A21\u578B\u8BAD\u7EC3\uFF0C\u6027\u4EF7\u6BD4\u9AD8",
    basePricePerTFLOPSDay: 0.07,
    unitTFLOPS: 50,
    minRentalDays: 30,
    maxRentalDays: 90
  },
  {
    id: "aurora",
    name: "Aurora AI",
    description: "\u4E9A\u6D32\u6700\u5927\u4E91\u5E73\u53F0\uFF0C\u4E1C\u4E9A\u5730\u533A\u4F9B\u5E94\u5145\u8DB3\uFF0C\u4EF7\u683C\u6709\u7ADE\u4E89\u529B",
    basePricePerTFLOPSDay: 0.08,
    unitTFLOPS: 100,
    minRentalDays: 7,
    maxRentalDays: 365
  },
  {
    id: "tenji",
    name: "Tenji Compute",
    description: "\u4E9A\u592A\u533A\u4E91\u4E3B\u529B\uFF0C\u65B0\u52A0\u5761/\u4E1C\u4EAC\u8282\u70B9\u8D28\u91CF\u9AD8",
    basePricePerTFLOPSDay: 0.09,
    unitTFLOPS: 100,
    minRentalDays: 7,
    maxRentalDays: 180
  }
];
function calcCloudRentalPrice(provider, region) {
  const supplyMultiplier = 1.2 - region.computeIndex / 100 * 0.6;
  return Math.round(provider.basePricePerTFLOPSDay * supplyMultiplier * 100) / 100;
}
function calcCloudMaxTFLOPS(provider, region) {
  const basePool = 500;
  const indexPool = region.computeIndex * 50;
  const providerMultiplier = {
    nimbus: 1.5,
    stratus: 0.8,
    cirrus: 1.2,
    nova: 0.4,
    aurora: 1,
    tenji: 0.9
  };
  return Math.round((basePool + indexPool) * (providerMultiplier[provider.id] ?? 1));
}
var CLOUD_PROVIDER_MAP = Object.fromEntries(
  CLOUD_PROVIDERS.map((p) => [p.id, p])
);

// ../../src/core/commands/RentComputeCommand.ts
function genId10(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
var RentCloudComputeCommand = class {
  constructor(providerId, tflops, days) {
    this.providerId = providerId;
    this.tflops = tflops;
    this.days = days;
  }
  execute(state, events) {
    const provider = CLOUD_PROVIDER_MAP[this.providerId];
    if (!provider) {
      events.emit("CLOUD_RENTAL_REJECTED", { reason: "\u672A\u77E5\u4E91\u670D\u52A1\u5546" });
      return;
    }
    if (this.tflops <= 0) {
      events.emit("CLOUD_RENTAL_REJECTED", { reason: "\u7B97\u529B\u5FC5\u987B\u5927\u4E8E 0" });
      return;
    }
    if (this.days < provider.minRentalDays || this.days > provider.maxRentalDays) {
      events.emit("CLOUD_RENTAL_REJECTED", {
        reason: `\u79DF\u7528\u5929\u6570\u9700\u5728 ${provider.minRentalDays}-${provider.maxRentalDays} \u5929\u4E4B\u95F4`
      });
      return;
    }
    if (this.tflops % provider.unitTFLOPS !== 0) {
      events.emit("CLOUD_RENTAL_REJECTED", {
        reason: `\u79DF\u7528\u91CF\u9700\u4E3A ${provider.unitTFLOPS} TFLOPS \u7684\u6574\u6570\u500D`
      });
      return;
    }
    const current2 = state.read();
    const hqRegionId = current2.headquartersRegionId;
    if (!hqRegionId) {
      events.emit("CLOUD_RENTAL_REJECTED", { reason: "\u672A\u8BBE\u7F6E\u603B\u90E8\u5730\u533A" });
      return;
    }
    const region = REGIONS.find((r) => r.id === hqRegionId);
    if (!region) {
      events.emit("CLOUD_RENTAL_REJECTED", { reason: "\u5730\u533A\u6570\u636E\u4E0D\u5B58\u5728" });
      return;
    }
    const rawContracts = current2.resourceMeta["cloud_rental_contracts"];
    const activeContracts = Array.isArray(rawContracts) ? rawContracts : [];
    const existingTFLOPS = activeContracts.filter((c) => c.providerId === this.providerId && c.regionId === hqRegionId).reduce((s, c) => s + c.tflops, 0);
    const maxTFLOPS = calcCloudMaxTFLOPS(provider, region);
    if (existingTFLOPS + this.tflops > maxTFLOPS) {
      events.emit("CLOUD_RENTAL_REJECTED", {
        reason: `\u8D85\u51FA\u8BE5\u670D\u52A1\u5546\u53EF\u7528\u7B97\u529B\u4E0A\u9650\uFF08\u5DF2\u79DF ${existingTFLOPS} TFLOPS\uFF0C\u4E0A\u9650 ${maxTFLOPS} TFLOPS\uFF09`
      });
      return;
    }
    const dailyPrice = calcCloudRentalPrice(provider, region);
    const totalCost = Math.round(dailyPrice * this.tflops * this.days);
    const funds = current2.resources["funds"] ?? 0;
    if (funds < totalCost) {
      events.emit("CLOUD_RENTAL_REJECTED", {
        reason: "\u8D44\u91D1\u4E0D\u8DB3",
        required: totalCost,
        funds
      });
      return;
    }
    const contract = {
      id: genId10("cloud"),
      providerId: this.providerId,
      tflops: this.tflops,
      dailyCost: Math.round(dailyPrice * this.tflops * 100) / 100,
      totalDays: this.days,
      elapsedDays: 0,
      startedAt: current2.date,
      expiresAt: current2.date + this.days,
      regionId: hqRegionId,
      totalPaid: totalCost
    };
    state.update((draft) => {
      draft.resources["funds"] -= totalCost;
      const rawContracts2 = draft.resourceMeta["cloud_rental_contracts"];
      const contracts2 = Array.isArray(rawContracts2) ? rawContracts2 : [];
      contracts2.push(contract);
      draft.resourceMeta["cloud_rental_contracts"] = contracts2;
    });
    events.emit("CLOUD_RENTAL_STARTED", {
      provider: provider.name,
      tflops: this.tflops,
      days: this.days,
      dailyCost: contract.dailyCost,
      totalCost,
      region: region.name
    });
  }
};

// ../../src/core/commands/RiskCommands.ts
var SettleLawsuitCommand = class {
  execute(state, events) {
    const current2 = state.read();
    if (current2.riskState.legalDebt < 3) {
      events.emit("SETTLE_REJECTED", { reason: "legal_debt \u4E0D\u8DB3 3\uFF0C\u65E0\u9700\u548C\u89E3" });
      return;
    }
    const cost = Math.floor(current2.riskState.legalDebt) * 1e5;
    const funds = current2.resources["funds"] ?? 0;
    if (funds < cost) {
      events.emit("SETTLE_REJECTED", { reason: "\u8D44\u91D1\u4E0D\u8DB3", cost });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] -= cost;
      draft.riskState.legalDebt = Math.max(0, draft.riskState.legalDebt - 3);
      draft.riskState.reputation = Math.min(100, draft.riskState.reputation + 5);
    });
    events.emit("LAWSUIT_SETTLED", { cost, legalDebtReduction: 3 });
  }
};
var PublicApologyCommand = class {
  execute(state, events) {
    const current2 = state.read();
    if (current2.riskState.trustDebt < 2) {
      events.emit("APOLOGY_REJECTED", { reason: "trust_debt \u4E0D\u8DB3 2" });
      return;
    }
    state.update((draft) => {
      draft.riskState.trustDebt = Math.max(0, draft.riskState.trustDebt - 2);
      draft.riskState.reputation = Math.max(0, draft.riskState.reputation - 5);
    });
    events.emit("APOLOGY_MADE");
  }
};
var ConductAuditCommand = class {
  constructor(modelId) {
    this.modelId = modelId;
  }
  execute(state, events) {
    const current2 = state.read();
    if (!isTechUnlocked(current2, "alignment_v1")) {
      events.emit("AUDIT_REJECTED", { reason: "\u9700\u8981\u5BF9\u9F50v1\u6280\u672F" });
      return;
    }
    const model = current2.models.find((m) => m.id === this.modelId);
    if (!model) {
      events.emit("AUDIT_REJECTED", { reason: "\u6A21\u578B\u4E0D\u5B58\u5728" });
      return;
    }
    state.update((draft) => {
      const m = draft.models.find((x) => x.id === this.modelId);
      if (m) {
        m.audited = true;
      }
      draft.riskState.alignmentLevel = Math.min(1, draft.riskState.alignmentLevel + 0.1);
    });
    events.emit("AUDIT_COMPLETED", { modelId: this.modelId });
  }
};
var UseModelInResearchCommand = class {
  constructor(modelId) {
    this.modelId = modelId;
  }
  execute(state, events) {
    const current2 = state.read();
    const model = current2.models.find((m) => m.id === this.modelId);
    if (!model) {
      events.emit("USE_MODEL_REJECTED", { reason: "\u6A21\u578B\u4E0D\u5B58\u5728" });
      return;
    }
    state.update((draft) => {
      const m = draft.models.find((x) => x.id === this.modelId);
      if (m) {
        m.usedInResearch = true;
      }
    });
    events.emit("MODEL_USED_IN_RESEARCH", { modelId: this.modelId });
  }
};

// ../../src/core/commands/SmallCompanyCommands.ts
var AcquireSmallCompanyCommand = class {
  constructor(companyId) {
    this.companyId = companyId;
  }
  execute(state, events) {
    const current2 = state.read();
    const company = current2.smallCompanies.find((c) => c.id === this.companyId);
    if (!company) {
      events.emit("ACQUIRE_REJECTED", { reason: "\u516C\u53F8\u4E0D\u5B58\u5728" });
      return;
    }
    if (company.acquired) {
      events.emit("ACQUIRE_REJECTED", { reason: "\u5DF2\u88AB\u6536\u8D2D" });
      return;
    }
    if (current2.date - company.spawnedDay > company.lifespan) {
      events.emit("ACQUIRE_REJECTED", { reason: "\u5DF2\u8FC7\u671F" });
      return;
    }
    const funds = current2.resources["funds"] ?? 0;
    if (funds < company.valuation) {
      events.emit("ACQUIRE_REJECTED", { reason: "\u8D44\u91D1\u4E0D\u8DB3" });
      return;
    }
    const newUniqueCount = company.technologies.filter((tid) => {
      const poolNode = SMALL_COMPANY_TECH_POOL.find((t) => t.id === tid);
      return poolNode && !IDEA_TECH_MAP[poolNode.id];
    }).length;
    if (newUniqueCount > 0 && !canAcceptUniqueTechs(current2, newUniqueCount)) {
      const used = getUniqueTechCount(current2);
      const max = getMaxUniqueTechSlots(current2);
      events.emit("ACQUIRE_REJECTED", {
        reason: `\u72EC\u6709\u6280\u672F\u69FD\u4F4D\u4E0D\u8DB3\uFF1A\u9700 ${newUniqueCount} \u4E2A\uFF0C\u5269\u4F59 ${max - used} \u4E2A (${used}/${max})`
      });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] = (draft.resources["funds"] ?? 0) - company.valuation;
      const target = draft.smallCompanies.find((c) => c.id === this.companyId);
      if (target) target.acquired = true;
      for (const techId of company.technologies) {
        const poolNode = SMALL_COMPANY_TECH_POOL.find((t) => t.id === techId);
        if (poolNode && !IDEA_TECH_MAP[poolNode.id]) {
          IDEA_TECH_MAP[poolNode.id] = poolNode;
          draft.acceptedIdeaTechs.push(poolNode);
        }
        const acquiredMat = company.techMaturities?.[techId] ?? 40;
        const existing = draft.techMaturity[techId] ?? 0;
        draft.techMaturity[techId] = Math.max(existing, acquiredMat);
      }
    });
    events.emit("SMALL_COMPANY_ACQUIRED", company);
  }
};

// ../../src/core/commands/StaffTrainingCommands.ts
function genId11(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
var StartStaffTrainingCommand = class {
  constructor(employeeId, trainingType, targetAttribute) {
    this.employeeId = employeeId;
    this.trainingType = trainingType;
    this.targetAttribute = targetAttribute;
  }
  execute(state, events) {
    const cfg = STAFF_TRAINING_CONFIG[this.trainingType];
    if (!cfg) {
      events.emit("STAFF_TRAINING_REJECTED", { reason: "\u672A\u77E5\u57F9\u8BAD\u7C7B\u578B" });
      return;
    }
    const current2 = state.read();
    const emp = current2.employees.find((e) => e.id === this.employeeId);
    if (!emp) {
      events.emit("STAFF_TRAINING_REJECTED", { reason: "\u5458\u5DE5\u4E0D\u5B58\u5728" });
      return;
    }
    if (emp.status === "assigned") {
      events.emit("STAFF_TRAINING_REJECTED", { reason: "\u5458\u5DE5\u5DF2\u88AB\u5206\u914D\u5230\u9879\u76EE\uFF0C\u65E0\u6CD5\u53C2\u52A0\u57F9\u8BAD" });
      return;
    }
    if (emp.status === "training") {
      events.emit("STAFF_TRAINING_REJECTED", { reason: "\u5458\u5DE5\u6B63\u5728\u57F9\u8BAD\u4E2D" });
      return;
    }
    if (emp.level < cfg.minLevel) {
      events.emit("STAFF_TRAINING_REJECTED", {
        reason: `\u7B49\u7EA7\u4E0D\u8DB3\uFF0C\u9700 ${cfg.minLevel} \u7EA7`
      });
      return;
    }
    const funds = current2.resources["funds"] ?? 0;
    if (funds < cfg.cost) {
      events.emit("STAFF_TRAINING_REJECTED", {
        reason: "\u8D44\u91D1\u4E0D\u8DB3",
        cost: cfg.cost,
        funds
      });
      return;
    }
    if (!cfg.allAttributes && !this.targetAttribute) {
      events.emit("STAFF_TRAINING_REJECTED", { reason: "\u9700\u6307\u5B9A\u76EE\u6807\u5C5E\u6027" });
      return;
    }
    const trainingId = genId11("training");
    const training = {
      id: trainingId,
      type: this.trainingType,
      employeeId: this.employeeId,
      startedAt: current2.date,
      totalDays: cfg.durationDays,
      elapsedDays: 0,
      status: "in_progress",
      targetAttribute: cfg.allAttributes ? null : this.targetAttribute
    };
    state.update((draft) => {
      draft.resources["funds"] -= cfg.cost;
      draft.staffTrainings.push(training);
      const target = draft.employees.find((e) => e.id === this.employeeId);
      if (target) {
        target.status = "training";
        target.trainingId = trainingId;
      }
    });
    events.emit("STAFF_TRAINING_STARTED", {
      employeeId: this.employeeId,
      trainingId,
      type: this.trainingType,
      cost: cfg.cost,
      durationDays: cfg.durationDays
    });
  }
};
var CancelStaffTrainingCommand = class {
  constructor(trainingId) {
    this.trainingId = trainingId;
  }
  execute(state, events) {
    const current2 = state.read();
    const training = current2.staffTrainings.find((t) => t.id === this.trainingId);
    if (!training) {
      events.emit("STAFF_TRAINING_CANCEL_REJECTED", { reason: "\u57F9\u8BAD\u9879\u76EE\u4E0D\u5B58\u5728" });
      return;
    }
    if (training.status !== "in_progress") {
      events.emit("STAFF_TRAINING_CANCEL_REJECTED", { reason: "\u57F9\u8BAD\u5DF2\u7ED3\u675F" });
      return;
    }
    state.update((draft) => {
      const t = draft.staffTrainings.find((x) => x.id === this.trainingId);
      if (t) t.status = "cancelled";
      const emp = draft.employees.find((e) => e.id === training.employeeId);
      if (emp) {
        emp.status = "idle";
        emp.trainingId = void 0;
      }
    });
    events.emit("STAFF_TRAINING_CANCELLED", this.trainingId);
  }
};

// ../../src/core/commands/TechCommands.ts
var PolishTechCommand = class {
  constructor(techId, researcherIds, days = 7) {
    this.techId = techId;
    this.researcherIds = researcherIds;
    this.days = days;
  }
  execute(state, events) {
    const current2 = state.read();
    const maturity = current2.techMaturity[this.techId] ?? 0;
    if (maturity < 1) {
      events.emit("POLISH_REJECTED", { reason: "\u6280\u672F\u672A\u89E3\u9501\uFF0C\u65E0\u6CD5\u6253\u78E8" });
      return;
    }
    if (maturity >= 100) {
      events.emit("POLISH_REJECTED", { reason: "\u6280\u672F\u5DF2\u6EE1\u7EA7" });
      return;
    }
    if (this.days < 1 || this.days > 14) {
      events.emit("POLISH_REJECTED", { reason: "\u6253\u78E8\u5929\u6570\u5FC5\u987B\u5728 1~14 \u4E4B\u95F4" });
      return;
    }
    const researchers = [];
    for (const rid of this.researcherIds) {
      const emp = current2.employees.find((e) => e.id === rid);
      if (!emp || emp.role !== "researcher" /* RESEARCHER */) {
        events.emit("POLISH_REJECTED", { reason: "\u65E0\u6548\u7814\u7A76\u5458" });
        return;
      }
      if (emp.status !== "idle") {
        events.emit("POLISH_REJECTED", { reason: `${emp.name} \u4E0D\u53EF\u7528` });
        return;
      }
      researchers.push(emp);
    }
    if (researchers.length === 0) {
      events.emit("POLISH_REJECTED", { reason: "\u81F3\u5C11\u9700\u8981 1 \u540D\u7814\u7A76\u5458" });
      return;
    }
    let sumIntelligence = 0;
    for (const r of researchers) {
      const eff = calcEmployeeEfficiency(r, current2.departments, current2.employees);
      sumIntelligence += eff * r.attributes.intelligence;
    }
    const dailyGain = 0.3 * (1 + sumIntelligence / 200);
    const totalGain = dailyGain * this.days;
    const cost = 5e3 * researchers.length * this.days;
    const funds = current2.resources["funds"] ?? 0;
    if (funds < cost) {
      events.emit("POLISH_REJECTED", { reason: "\u8D44\u91D1\u4E0D\u8DB3", cost });
      return;
    }
    state.update((draft) => {
      draft.resources["funds"] = (draft.resources["funds"] ?? 0) - cost;
      const existing = draft.techMaturity[this.techId] ?? 0;
      draft.techMaturity[this.techId] = Math.min(100, existing + totalGain);
      const fatigueGain = this.days * 3;
      for (const r of researchers) {
        const target = draft.employees.find((e) => e.id === r.id);
        if (target) {
          target.fatigue = Math.min(100, target.fatigue + fatigueGain);
        }
      }
    });
    events.emit("TECH_POLISHED", {
      techId: this.techId,
      gain: totalGain,
      cost,
      researcherCount: researchers.length
    });
  }
};

// ../../src/core/entities/TrainingProject.ts
function createDefaultParallelConfig() {
  return { strategies: ["dp"], dpReplicas: 1, ppStages: 1, tpSize: 1, epGroups: 1, cpSize: 1 };
}

// ../../src/core/utils/trainingFeasibility.ts
function diagnoseTraining(paramCount, contextLength, _architecture, clusterId, state, parallelConfig) {
  const current2 = state.read();
  const issues = [];
  const cluster = current2.clusters.find((c) => c.id === clusterId);
  if (!cluster) {
    issues.push({ severity: "blocker", category: "network", message: "\u6240\u9009\u96C6\u7FA4\u4E0D\u5B58\u5728" });
    return issues;
  }
  const cardSpecs = [];
  const nodes = [];
  const diagIndex = getCardIndex(current2);
  for (const nodeId of cluster.nodes) {
    const node = current2.serverNodes.find((n) => n.id === nodeId);
    if (!node) continue;
    nodes.push(node);
    for (const cardUid of node.installedCards) {
      const entry = diagIndex.get(cardUid);
      if (entry && entry.card.status === "online" && entry.card.assignedProjectId === null) {
        const spec = getCardSpec(entry.modelId);
        if (spec) cardSpecs.push(spec);
      }
    }
  }
  if (cardSpecs.length === 0) {
    issues.push({ severity: "blocker", category: "gpu_count", message: "\u96C6\u7FA4\u5185\u65E0\u5728\u7EBFGPU\uFF0C\u8BF7\u5148\u5B89\u88C5\u8BA1\u7B97\u5361" });
    return issues;
  }
  if (nodes.length === 0) {
    issues.push({ severity: "blocker", category: "gpu_count", message: "\u96C6\u7FA4\u5185\u65E0\u53EF\u7528\u8282\u70B9" });
    return issues;
  }
  const paramB = paramCount;
  const weightMem = paramB * 2;
  const activationMem = weightMem * 2.2;
  const rawMemPerReplica = weightMem + activationMem;
  const ppReducer = (parallelConfig?.ppStages ?? 1) > 1 ? parallelConfig.ppStages : 1;
  const tpReducer = (parallelConfig?.tpSize ?? 1) > 1 ? parallelConfig.tpSize : 1;
  const totalMemPerReplica = rawMemPerReplica / (ppReducer * tpReducer);
  const minCardMem = Math.min(...cardSpecs.map((s) => s.memoryGB));
  const maxCardMem = Math.max(...cardSpecs.map((s) => s.memoryGB));
  const maxCardName = cardSpecs.find((s) => s.memoryGB === maxCardMem)?.name ?? "\u672A\u77E5";
  const tpSize = Math.max(1, Math.ceil(totalMemPerReplica / maxCardMem));
  if (totalMemPerReplica > maxCardMem) {
    const needCrossNode = tpSize > Math.max(...nodes.map((n) => n.slotCount));
    issues.push({
      severity: "warning",
      category: "memory",
      message: `\u6A21\u578B\u9700 ${totalMemPerReplica.toFixed(0)}GB \u663E\u5B58\uFF0C\u6700\u5927\u5355\u5361 ${maxCardName} \u4EC5 ${maxCardMem}GB\uFF0C\u9700\u81F3\u5C11 ${tpSize} \u5F20\u5361\u505A\u5F20\u91CF\u5E76\u884C\uFF08TP=${tpSize}\uFF09${needCrossNode ? "\uFF0C\u8D85\u51FA\u5355\u8282\u70B9\u69FD\u4F4D\u6570\uFF0C\u9700\u8DE8\u8282\u70B9 TP" : ""}`
    });
  }
  if (totalMemPerReplica <= minCardMem) {
    issues.push({
      severity: "warning",
      category: "memory",
      message: `\u6A21\u578B\u4EC5\u9700 ${totalMemPerReplica.toFixed(0)}GB \u663E\u5B58\uFF0C\u5355\u5361\u5373\u53EF\u88C5\u8F7D\uFF08\u4EC5\u9700 DP\uFF09`
    });
  }
  const availGpus = cardSpecs.length;
  if (tpSize > availGpus) {
    issues.push({
      severity: "blocker",
      category: "gpu_count",
      message: `\u9700\u8981\u81F3\u5C11 ${tpSize} \u5F20GPU\uFF08TP=${tpSize}\uFF09\uFF0C\u4F46\u96C6\u7FA4\u4EC5 ${availGpus} \u5F20\u5728\u7EBFGPU`
    });
  }
  const maxNodeBW = Math.max(...nodes.map((n) => n.interconnectBandwidth));
  const minIBW = contextLength > 32768 ? 600 : tpSize > 1 ? 200 : 0;
  if (minIBW > 0 && maxNodeBW < minIBW) {
    const nvGen = nodes[0]?.nvswitchGeneration;
    issues.push({
      severity: "blocker",
      category: "interconnect",
      message: `\u9700\u8981\u8282\u70B9\u4E92\u8054\u5E26\u5BBD \u2265${minIBW}GB/s${contextLength > 32768 ? "\uFF08\u957F\u4E0A\u4E0B\u6587\u8BAD\u7EC3\u9700 NVSwitch\uFF09" : "\uFF08\u6A21\u578B\u5E76\u884C\u901A\u4FE1\u9700\u6C42\uFF09"}\uFF0C\u5F53\u524D\u6700\u5927 ${maxNodeBW}GB/s${nvGen ? `\uFF08NVSwitch Gen${nvGen}\uFF09` : ""}\uFF0C\u8BF7\u5347\u7EA7\u8282\u70B9\u4E92\u8054\u6216\u51CF\u5C11\u53C2\u6570\u91CF`
    });
  }
  if (tpSize > Math.max(...nodes.map((n) => n.slotCount)) && cluster.networkBandwidth < 10) {
    issues.push({
      severity: "blocker",
      category: "network",
      message: `\u8DE8\u8282\u70B9 TP \u9700\u8981\u96C6\u7FA4\u7F51\u7EDC\u5E26\u5BBD \u226510GB/s\uFF0C\u5F53\u524D ${cluster.networkBandwidth.toFixed(0)}GB/s\uFF08${cluster.networkTopology ?? "unknown"}\uFF09\uFF0C\u8BF7\u4F7F\u7528\u66F4\u9AD8\u5E26\u5BBD\u7F51\u7EDC`
    });
  }
  const minStorageIO = availGpus * 0.1;
  if (cluster.storageIO < minStorageIO) {
    issues.push({
      severity: "warning",
      category: "storage",
      message: `\u5EFA\u8BAE\u5B58\u50A8 IO \u2265${minStorageIO.toFixed(1)}GB/s\uFF08\u6309 GPU \u6570\u4F30\u7B97\uFF09\uFF0C\u5F53\u524D ${cluster.storageIO}GB/s\uFF08${cluster.storageType}\uFF09\uFF0C\u53EF\u80FD\u62D6\u6162\u6570\u636E\u52A0\u8F7D`
    });
  }
  if (contextLength > 131072) {
    const nvGen = nodes[0]?.nvswitchGeneration ?? 0;
    if (nvGen < 2) {
      issues.push({
        severity: "warning",
        category: "context",
        message: `\u8D85\u957F\u4E0A\u4E0B\u6587\uFF08\u2265128K\uFF09\u5EFA\u8BAE NVSwitch Gen2+\uFF0C\u5F53\u524D Gen${nvGen}`
      });
    }
  }
  if (contextLength > 1048576) {
    const nvGen = nodes[0]?.nvswitchGeneration ?? 0;
    if (nvGen < 3) {
      issues.push({
        severity: "warning",
        category: "context",
        message: `\u767E\u4E07\u7EA7\u4E0A\u4E0B\u6587\u9700 NVSwitch Gen3+\uFF0C\u5F53\u524D Gen${nvGen}`
      });
    }
  }
  return issues;
}

// ../../src/core/commands/TrainingCommands.ts
function genId12(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function allocateCardsFromCluster(state, clusterId, minMemoryPerCard, maxCards) {
  const current2 = state.read();
  const cluster = current2.clusters.find((c) => c.id === clusterId);
  if (!cluster) return null;
  const assignments = {};
  const allocIndex = getCardIndex(current2);
  for (const nodeId of cluster.nodes) {
    const node = current2.serverNodes.find((n) => n.id === nodeId);
    if (!node) continue;
    const nodeCards = [];
    for (const cardUid of node.installedCards) {
      const entry = allocIndex.get(cardUid);
      if (entry && entry.card.status === "online" && entry.card.assignedProjectId === null) {
        const spec = getCardSpec(entry.modelId);
        if (spec && spec.memoryGB >= minMemoryPerCard) {
          nodeCards.push(cardUid);
        }
      }
    }
    if (nodeCards.length > 0) {
      assignments[nodeId] = nodeCards;
      if (maxCards !== void 0) {
        const total = Object.values(assignments).reduce((s, arr) => s + arr.length, 0);
        if (total >= maxCards) {
          const excess = total - maxCards;
          if (excess > 0) {
            nodeCards.splice(nodeCards.length - excess, excess);
            assignments[nodeId] = nodeCards;
          }
          break;
        }
      }
    }
  }
  const totalAssigned = Object.values(assignments).reduce((s, arr) => s + arr.length, 0);
  return totalAssigned > 0 ? assignments : null;
}
function autoDetectParallelConfig(current2, paramCount, clusterId) {
  const cluster = current2.clusters.find((c) => c.id === clusterId);
  if (!cluster) return createDefaultParallelConfig();
  let gpuMemory = 0;
  let totalCards = 0;
  const detectIndex = getCardIndex(current2);
  for (const nodeId of cluster.nodes) {
    const node = current2.serverNodes.find((n) => n.id === nodeId);
    if (!node) continue;
    for (const cardUid of node.installedCards) {
      const entry = detectIndex.get(cardUid);
      if (entry && entry.card.status === "online" && entry.card.assignedProjectId === null) {
        totalCards++;
        const spec = getCardSpec(entry.modelId);
        if (spec) {
          gpuMemory = gpuMemory === 0 ? spec.memoryGB : Math.min(gpuMemory, spec.memoryGB);
        }
      }
    }
  }
  if (gpuMemory === 0) gpuMemory = getCardSpec("compute_h100")?.memoryGB ?? 80;
  const rawMem = paramCount * 2;
  if (rawMem <= gpuMemory) {
    return createDefaultParallelConfig();
  }
  const reductionNeeded = Math.ceil(rawMem / gpuMemory);
  const activeTechEffects = getActiveTechEffects(current2);
  const hasPP = activeTechEffects.some(
    (e) => (e.type === "parallel_reliability" || e.type === "unlock_parallel_strategy") && e.strategy === "pp"
  );
  const hasTP = activeTechEffects.some(
    (e) => (e.type === "parallel_reliability" || e.type === "unlock_parallel_strategy") && e.strategy === "tp"
  );
  let ppStages = 1;
  let tpSize = 1;
  if (hasPP && hasTP) {
    const half = Math.min(Math.ceil(Math.sqrt(reductionNeeded)), Math.floor(Math.sqrt(totalCards)));
    ppStages = Math.max(1, half);
    tpSize = Math.max(1, Math.min(half, Math.ceil(reductionNeeded / ppStages)));
  } else if (hasPP) {
    ppStages = Math.min(8, Math.max(1, Math.ceil(reductionNeeded)));
  } else if (hasTP) {
    tpSize = Math.min(8, Math.max(1, Math.ceil(reductionNeeded)));
  }
  return {
    strategies: ["dp"],
    dpReplicas: Math.max(1, Math.floor(totalCards / (ppStages * tpSize))),
    ppStages,
    tpSize,
    epGroups: 1,
    cpSize: 1
  };
}
var StartTrainingCommand = class {
  constructor(modelName, paramCount, architecture, clusterId, minMemoryPerCard, contextLength = 4096, datasetId = "dataset-initial", techIds = ["pretraining"], isExperimental = false, parallelConfig) {
    this.modelName = modelName;
    this.paramCount = paramCount;
    this.architecture = architecture;
    this.clusterId = clusterId;
    this.minMemoryPerCard = minMemoryPerCard;
    this.contextLength = contextLength;
    this.datasetId = datasetId;
    this.techIds = techIds;
    this.isExperimental = isExperimental;
    this.parallelConfig = parallelConfig;
  }
  execute(state, events) {
    const current2 = state.read();
    const cluster = current2.clusters.find((c) => c.id === this.clusterId);
    if (!cluster) {
      events.emit("TRAINING_REJECTED", { reason: "\u96C6\u7FA4\u4E0D\u5B58\u5728" });
      return;
    }
    const autoPC = this.parallelConfig ?? autoDetectParallelConfig(
      current2,
      this.paramCount,
      this.clusterId
    );
    const pc = autoPC;
    const issues = diagnoseTraining(
      this.paramCount,
      this.contextLength,
      this.architecture,
      this.clusterId,
      state,
      pc
    );
    const blockers = issues.filter((i) => i.severity === "blocker");
    if (blockers.length > 0) {
      events.emit("TRAINING_REJECTED", {
        reason: blockers.map((i) => i.message).join("\uFF1B"),
        issues
      });
      return;
    }
    const ppReduction = pc.ppStages > 1 ? pc.ppStages : 1;
    const tpReduction = pc.tpSize > 1 ? pc.tpSize : 1;
    const memDivisor = ppReduction * tpReduction;
    const modelParams = {
      paramCount: this.paramCount,
      architecture: this.architecture,
      parallelConfig: pc
    };
    const rawMemPerCard = this.minMemoryPerCard ?? Math.ceil(modelParams.paramCount * 2);
    const minMem = Math.max(1, Math.ceil(rawMemPerCard / memDivisor));
    const assignments = allocateCardsFromCluster(state, this.clusterId, minMem);
    if (!assignments) {
      events.emit("TRAINING_REJECTED", { reason: "\u96C6\u7FA4\u4E2D\u65E0\u6EE1\u8DB3\u663E\u5B58\u8981\u6C42\u7684\u53EF\u7528\u5361" });
      return;
    }
    const dataset = current2.datasets.find((d) => d.id === this.datasetId);
    const trainingTokens = dataset ? dataset.totalTokens : 1;
    const computeTotal = calcTrainingCompute(
      this.paramCount * 1e9,
      trainingTokens * 1e9,
      this.contextLength
    );
    const today = current2.date;
    const project = {
      id: genId12("train"),
      modelName: this.modelName,
      paramCount: this.paramCount,
      architecture: this.architecture,
      status: "training",
      computeRemaining: computeTotal,
      computeTotal,
      clusterId: this.clusterId,
      nodeAssignments: assignments,
      startedAt: today,
      completedAt: null,
      pauseReason: null,
      lastCheckpointRemaining: computeTotal,
      checkpointInterval: Math.max(computeTotal * 0.05, 1),
      lastCheckpointDay: today,
      lostFlops: 0,
      contextLength: this.contextLength,
      datasetId: this.datasetId,
      techIds: [...this.techIds],
      isExperimental: this.isExperimental,
      // 训练过程追踪初始值
      currentLoss: 10,
      validationLoss: 10,
      lossHistory: [],
      stabilityScore: 1,
      lossSpikeCount: 0,
      gradientExplosionCount: 0,
      trainingPhase: "warmup",
      trainingLog: [],
      spikeRecoveryDays: 0,
      parallelConfig: pc
    };
    state.update((draft) => {
      draft.trainingProjects.push(project);
      const markIndex = getCardIndex(draft);
      for (const cardUids of Object.values(assignments)) {
        for (const uid of cardUids) {
          const entry = markIndex.get(uid);
          if (entry) {
            entry.card.assignedProjectId = project.id;
          }
        }
      }
    });
    events.emit("TRAINING_STARTED", project.id, project.modelName);
  }
};
var CancelTrainingCommand = class {
  constructor(projectId) {
    this.projectId = projectId;
  }
  execute(state, events) {
    const current2 = state.read();
    const project = current2.trainingProjects.find((p) => p.id === this.projectId);
    if (!project) {
      events.emit("TRAINING_CANCEL_REJECTED", { reason: "\u9879\u76EE\u4E0D\u5B58\u5728" });
      return;
    }
    state.update((draft) => {
      const cancelIndex = getCardIndex(draft);
      for (const cardUids of Object.values(project.nodeAssignments)) {
        for (const uid of cardUids) {
          const entry = cancelIndex.get(uid);
          if (entry) {
            entry.card.assignedProjectId = null;
          }
        }
      }
      draft.trainingProjects = draft.trainingProjects.filter((p) => p.id !== this.projectId);
    });
    events.emit("TRAINING_CANCELLED", this.projectId);
  }
};
var ResumeTrainingCommand = class {
  constructor(projectId) {
    this.projectId = projectId;
  }
  execute(state, events) {
    const current2 = state.read();
    const project = current2.trainingProjects.find((p) => p.id === this.projectId);
    if (!project) {
      events.emit("TRAINING_RESUME_REJECTED", { reason: "\u9879\u76EE\u4E0D\u5B58\u5728" });
      return;
    }
    if (project.status !== "paused") {
      events.emit("TRAINING_RESUME_REJECTED", { reason: "\u9879\u76EE\u672A\u6682\u505C" });
      return;
    }
    const resumeIndex = getCardIndex(current2);
    let hasOnlineCard = false;
    for (const cardUids of Object.values(project.nodeAssignments)) {
      for (const uid of cardUids) {
        const entry = resumeIndex.get(uid);
        if (entry && entry.card.status === "online") {
          hasOnlineCard = true;
          break;
        }
      }
      if (hasOnlineCard) break;
    }
    if (!hasOnlineCard) {
      events.emit("TRAINING_RESUME_REJECTED", { reason: "\u65E0\u5728\u7EBF\u8BA1\u7B97\u5361\uFF0C\u8BF7\u5148\u4FEE\u590D\u6545\u969C" });
      return;
    }
    state.update((draft) => {
      const p = draft.trainingProjects.find((x) => x.id === this.projectId);
      if (p) {
        p.status = "training";
        p.pauseReason = null;
      }
    });
    events.emit("TRAINING_RESUMED", this.projectId);
  }
};
var ReallocateTrainingCardsCommand = class {
  constructor(projectId, deltaCards) {
    this.projectId = projectId;
    this.deltaCards = deltaCards;
  }
  execute(state, events) {
    if (this.deltaCards === 0) {
      events.emit("TRAINING_REALLOC_REJECTED", { reason: "\u8C03\u6574\u6570\u91CF\u4E3A 0" });
      return;
    }
    const current2 = state.read();
    const project = current2.trainingProjects.find((p) => p.id === this.projectId);
    if (!project) {
      events.emit("TRAINING_REALLOC_REJECTED", { reason: "\u9879\u76EE\u4E0D\u5B58\u5728" });
      return;
    }
    if (project.status !== "training" && project.status !== "paused") {
      events.emit("TRAINING_REALLOC_REJECTED", { reason: `\u9879\u76EE\u72B6\u6001 ${project.status} \u4E0D\u5141\u8BB8\u8C03\u6574` });
      return;
    }
    const cluster = current2.clusters.find((c) => c.id === project.clusterId);
    if (!cluster) {
      events.emit("TRAINING_REALLOC_REJECTED", { reason: "\u96C6\u7FA4\u4E0D\u5B58\u5728" });
      return;
    }
    const reallocIndex = getCardIndex(current2);
    let minMemoryPerCard = 0;
    for (const cardUids of Object.values(project.nodeAssignments)) {
      for (const uid of cardUids) {
        const entry = reallocIndex.get(uid);
        if (entry) {
          const spec = getCardSpec(entry.modelId);
          if (spec) {
            minMemoryPerCard = minMemoryPerCard === 0 ? spec.memoryGB : Math.min(minMemoryPerCard, spec.memoryGB);
          }
        }
      }
    }
    if (this.deltaCards > 0) {
      const freeCards = [];
      for (const nodeId of cluster.nodes) {
        const node = current2.serverNodes.find((n) => n.id === nodeId);
        if (!node) continue;
        for (const cardUid of node.installedCards) {
          const entry = reallocIndex.get(cardUid);
          if (entry && entry.card.status === "online" && entry.card.assignedProjectId === null) {
            const spec = getCardSpec(entry.modelId);
            if (spec && spec.memoryGB >= minMemoryPerCard) {
              freeCards.push(cardUid);
            }
          }
        }
      }
      if (freeCards.length === 0) {
        events.emit("TRAINING_REALLOC_REJECTED", { reason: "\u96C6\u7FA4\u5185\u65E0\u53EF\u7528\u7A7A\u95F2\u5361" });
        return;
      }
      const toAdd = freeCards.slice(0, this.deltaCards);
      state.update((draft) => {
        const p = draft.trainingProjects.find((x) => x.id === this.projectId);
        if (!p) return;
        const addIndex = getCardIndex(draft);
        for (const uid of toAdd) {
          const entry = addIndex.get(uid);
          if (entry) {
            entry.card.assignedProjectId = this.projectId;
          }
          let placed = false;
          for (const node of draft.serverNodes) {
            if (node.installedCards.includes(uid)) {
              if (!p.nodeAssignments[node.id]) p.nodeAssignments[node.id] = [];
              p.nodeAssignments[node.id].push(uid);
              placed = true;
              break;
            }
          }
          if (!placed) {
            const firstKey = Object.keys(p.nodeAssignments)[0];
            if (firstKey) p.nodeAssignments[firstKey].push(uid);
          }
        }
      });
      const updatedProjectAdd = state.read().trainingProjects.find((p) => p.id === this.projectId);
      const actualTotalAdd = updatedProjectAdd ? Object.values(updatedProjectAdd.nodeAssignments).reduce((s, a) => s + a.length, 0) : 0;
      events.emit("TRAINING_REALLOCATED", {
        projectId: this.projectId,
        delta: toAdd.length,
        totalCards: actualTotalAdd
      });
    } else {
      const releaseCount = Math.min(
        -this.deltaCards,
        Object.values(project.nodeAssignments).reduce((s, a) => s + a.length, 0) - 1
      );
      if (releaseCount <= 0) {
        events.emit("TRAINING_REALLOC_REJECTED", { reason: "\u81F3\u5C11\u9700\u4FDD\u7559 1 \u5F20\u5361\uFF1B\u5982\u9700\u91CA\u653E\u5168\u90E8\u8BF7\u53D6\u6D88\u8BAD\u7EC3" });
        return;
      }
      const releaseUids = [];
      state.update((draft) => {
        const p = draft.trainingProjects.find((x) => x.id === this.projectId);
        if (!p) return;
        let remaining = releaseCount;
        const nodeIds = Object.keys(p.nodeAssignments);
        for (let i = nodeIds.length - 1; i >= 0 && remaining > 0; i--) {
          const nid = nodeIds[i];
          const arr = p.nodeAssignments[nid];
          while (arr.length > 0 && remaining > 0) {
            const uid = arr.pop();
            releaseUids.push(uid);
            remaining--;
          }
          if (arr.length === 0) delete p.nodeAssignments[nid];
        }
        const releaseIndex = getCardIndex(draft);
        for (const uid of releaseUids) {
          const entry = releaseIndex.get(uid);
          if (entry) {
            entry.card.assignedProjectId = null;
          }
        }
      });
      const updatedProjectRelease = state.read().trainingProjects.find((p) => p.id === this.projectId);
      const actualTotalRelease = updatedProjectRelease ? Object.values(updatedProjectRelease.nodeAssignments).reduce((s, a) => s + a.length, 0) : 0;
      events.emit("TRAINING_REALLOCATED", {
        projectId: this.projectId,
        delta: -releaseUids.length,
        totalCards: actualTotalRelease
      });
    }
  }
};
var SetParallelStrategyCommand = class {
  constructor(projectId, config) {
    this.projectId = projectId;
    this.config = config;
  }
  execute(state, events) {
    const current2 = state.read();
    const project = current2.trainingProjects.find((p) => p.id === this.projectId);
    if (!project) {
      events.emit("PARALLEL_CONFIG_REJECTED", { reason: "\u8BAD\u7EC3\u9879\u76EE\u4E0D\u5B58\u5728" });
      return;
    }
    if (project.status === "completed" || project.status === "failed") {
      events.emit("PARALLEL_CONFIG_REJECTED", { reason: "\u5DF2\u5B8C\u6210/\u5931\u8D25\u7684\u9879\u76EE\u4E0D\u80FD\u4FEE\u6539\u7B56\u7565" });
      return;
    }
    const unlockedStrategies = /* @__PURE__ */ new Set(["dp"]);
    const techEffects = getActiveTechEffects(current2);
    for (const eff of techEffects) {
      if (eff.type === "unlock_parallel_strategy" || eff.type === "parallel_reliability") {
        unlockedStrategies.add(eff.strategy);
      }
    }
    const pc = { ...project.parallelConfig };
    if (this.config.ppStages !== void 0) pc.ppStages = this.config.ppStages;
    if (this.config.tpSize !== void 0) pc.tpSize = this.config.tpSize;
    if (this.config.dpReplicas !== void 0) pc.dpReplicas = this.config.dpReplicas;
    if (this.config.epGroups !== void 0) pc.epGroups = this.config.epGroups;
    if (this.config.cpSize !== void 0) pc.cpSize = this.config.cpSize;
    const newStrategies = ["dp"];
    if (pc.ppStages > 1) {
      if (!unlockedStrategies.has("pp")) {
        events.emit("PARALLEL_CONFIG_REJECTED", { reason: "\u6D41\u6C34\u7EBF\u5E76\u884C (PP) \u672A\u89E3\u9501\uFF0C\u9700\u7814\u53D1 pipeline_parallel" });
        return;
      }
      newStrategies.push("pp");
    }
    if (pc.tpSize > 1) {
      if (!unlockedStrategies.has("tp")) {
        events.emit("PARALLEL_CONFIG_REJECTED", { reason: "\u5F20\u91CF\u5E76\u884C (TP) \u672A\u89E3\u9501\uFF0C\u9700\u7814\u53D1 tensor_parallel" });
        return;
      }
      newStrategies.push("tp");
    }
    if (pc.epGroups > 1) {
      if (!unlockedStrategies.has("ep")) {
        events.emit("PARALLEL_CONFIG_REJECTED", { reason: "\u4E13\u5BB6\u5E76\u884C (EP) \u672A\u89E3\u9501\uFF0C\u9700\u7814\u53D1 expert_parallel" });
        return;
      }
      if (project.architecture !== "moe") {
        events.emit("PARALLEL_CONFIG_REJECTED", { reason: "\u4E13\u5BB6\u5E76\u884C (EP) \u4EC5\u652F\u6301 MoE \u67B6\u6784" });
        return;
      }
      newStrategies.push("ep");
    }
    if (pc.cpSize > 1) {
      if (!unlockedStrategies.has("cp")) {
        events.emit("PARALLEL_CONFIG_REJECTED", { reason: "\u4E0A\u4E0B\u6587\u5E76\u884C (CP) \u672A\u89E3\u9501\uFF0C\u9700\u7814\u53D1 context_parallel" });
        return;
      }
      newStrategies.push("cp");
    }
    const totalCards = Object.values(project.nodeAssignments).reduce((s, a) => s + a.length, 0);
    const requiredCards = pc.dpReplicas * pc.ppStages * pc.tpSize;
    if (requiredCards !== totalCards) {
      events.emit("PARALLEL_CONFIG_REJECTED", {
        reason: `3D \u5E76\u884C\u4E0D\u5339\u914D\uFF1ADP(${pc.dpReplicas}) \xD7 PP(${pc.ppStages}) \xD7 TP(${pc.tpSize}) = ${requiredCards} \u2260 \u603B\u5361\u6570 ${totalCards}`
      });
      return;
    }
    if (pc.tpSize > 1) {
      const cluster = current2.clusters.find((c) => c.id === project.clusterId);
      if (cluster) {
        const hasNVLink = cluster.nodes.some((nid) => {
          const node = current2.serverNodes.find((n) => n.id === nid);
          return node ? (node.nvswitchGeneration ?? 0) >= 1 : false;
        });
        if (!hasNVLink) {
          events.emit("PARALLEL_CONFIG_REJECTED", { reason: "\u5F20\u91CF\u5E76\u884C (TP) \u8981\u6C42\u96C6\u7FA4\u81F3\u5C11\u5305\u542B NVSwitch \u8282\u70B9" });
          return;
        }
      }
    }
    pc.strategies = newStrategies;
    state.update((draft) => {
      const p = draft.trainingProjects.find((x) => x.id === this.projectId);
      if (p) {
        p.parallelConfig = pc;
      }
    });
    events.emit("PARALLEL_CONFIG_UPDATED", {
      projectId: this.projectId,
      strategies: pc.strategies,
      dpReplicas: pc.dpReplicas,
      ppStages: pc.ppStages,
      tpSize: pc.tpSize,
      epGroups: pc.epGroups,
      cpSize: pc.cpSize
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AcceptIdeaCommand,
  AcquireCompetitorCommand,
  AcquireDataCommand,
  AcquireSmallCompanyCommand,
  AddNodeToClusterCommand,
  AddResourceCommand,
  AdjustSalaryCommand,
  AdoptOpenSourceCommand,
  AllocateNormalStaffCommand,
  AppointDepartmentHeadCommand,
  AppointExecutiveCommand,
  AssaultKeyPersonnelCommand,
  AssignEmployeeCommand,
  BuildDataCenterCommand,
  BuildPowerPlantCommand,
  BuyGridPowerCommand,
  BuyServerNodeCommand,
  BuybackStockCommand,
  CancelResearchProjectCommand,
  CancelStaffTrainingCommand,
  CancelTrainingCommand,
  CleanupCandidatesCommand,
  ClearExperimentQueueCommand,
  CollectionSystem,
  CompetitorSystem,
  ComputeHardwareSystem,
  ConductAuditCommand,
  CreateClusterCommand,
  CreateDatasetCommand,
  CurateDatasetCommand,
  DEPARTMENT_NAMES,
  DEPARTMENT_ROLE_MAP,
  DedupDatasetCommand,
  DeleteDatasetCommand,
  DismissExecutiveCommand,
  DistillCompetitorCommand,
  EXTERNAL_CORPS,
  EnterRegionCommand,
  EventBus,
  FireEmployeeCommand,
  Game,
  GameState,
  GiveBonusCommand,
  GrantEquityCommand,
  HackParametersCommand,
  HireCandidateCommand,
  HireEmployeeCommand,
  HireNormalEmployeeCommand,
  HireNormalEmployeesBatchCommand,
  INITIAL_RESOURCES,
  IdeaGenerationSystem,
  InfiltrateCorpCommand,
  InfraMaintenanceSystem,
  InfrastructureFailureSystem,
  InstallCardCommand,
  IssueSecondaryOfferingCommand,
  LearnSkillCommand,
  MaintainDataCenterCommand,
  MaintainNodeCommand,
  MoveClusterCommand,
  OperationsSystem,
  PoachTalentCommand,
  PolishTechCommand,
  PostTrainingSystem,
  PowerSystem,
  PromoteEmployeeCommand,
  PublicApologyCommand,
  PublishInRegionCommand,
  PublishModelCommand,
  PurchaseHardwareCommand,
  PurgeDatasetCommand,
  QueueExperimentCommand,
  RaiseFundingCommand,
  ReallocateTrainingCardsCommand,
  RegionSystem,
  RejectCandidateCommand,
  RejectIdeaCommand,
  RemoveQueuedExperimentCommand,
  RentCloudComputeCommand,
  RepairCardCommand,
  RepairNodeCommand,
  RequestRecruitmentCommand,
  ResearchSystem,
  ResourceRegistry,
  RespondToMissionCommand,
  ResumeTrainingCommand,
  RiskSystem,
  ScrapCardCommand,
  SetDowngradeLevelCommand,
  SetHeadquartersCommand,
  SetModelResearchUsageCommand,
  SetParallelStrategyCommand,
  SetTokenPricingCommand,
  SettleLawsuitCommand,
  SmallCompanyMarketSystem,
  StaffSystem,
  StartDataCollectionCommand,
  StartExperimentCommand,
  StartStaffTrainingCommand,
  StartTrainingCommand,
  StopDataCollectionCommand,
  SwitchManagementModeCommand,
  SynthesizeDataCommand,
  TeamBuildingCommand,
  TechResearchSystem,
  ToggleSkipSafetyCommand,
  ToggleStealUserDataCommand,
  TrainingSystem,
  TransferDepartmentCommand,
  UninstallCardCommand,
  UniqueTechMaintenanceSystem,
  UnpublishModelCommand,
  UpgradeClusterStorageCommand,
  UpgradeNodeInterconnectCommand,
  UseModelInResearchCommand,
  allocateCardsFromCluster,
  createDefaultOperations,
  createInitialDataset
});
