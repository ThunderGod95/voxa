# Overview

I am thinking of adding a first-class stateful interaction system: buttons, select menus, modals, pagination, confirmations, and multi-step flows managed by the framework.

Voxa already makes Components V2 responses easier to construct, but currently stops at rendering them. Its interaction handler only accepts chat-input commands; component and modal interactions still need to be routed and managed manually by the bot developer.

A developer should be able to define an interactive view:

```ts
const staffRolesView = defineView({
    state: {},
    render({ state }) {},
    actions: {},
});
```

A command would then open it:

```ts
export default defineCommand({
    description: "...",

    async execute(ctx) {
        await ctx.openView(staffRolesView, {
            // ...
        });
    },
});
```

Voxa would handle:

- Generating safe custom IDs
- Associating interactions with the correct view instance
- Restricting interactions to the invoking user
- Loading and updating state
- Re-rendering the message
- Acknowledging interactions correctly
- Expiring inactive views
- Disabling or removing components after expiration
- Routing buttons, selects, and modal submissions
- Cleaning up completed sessions

This would make sophisticated bot interfaces easy to create.

## Coding Practice

I want clean, low-complexity solution to this new feature. If we can use a library or some other thing to reduce complexity, we should prefer to use that.

Things shouldn't be implemented uselessly or again and again just for the sake of it.

Best coding practices such as strict typing, don't repeat yourself, separation of concerns, etc., should be followed.

## Typed State

Moreover, state must be inferred from the view definition:

```ts
const paginator = defineView({
    state: {
        page: 0,
        selectedRoleId: null as string | null,
    },
    
    actions: {
        next({state}) {
            state.page++;
            state.selectedRoleId = null;
        }
    }
});
```

The action handler should know the exact state type.

For stricter immutability, actions could return state patches.

I would prefer returning a partial state update:

```ts
return {
    page: state.page + 1,
}
```

It allows accidental mutation, makes state transitions easier to inspect, and allows Voxa to decide when re-rendering occurs.

## Action context

Views should receive the full CommandContext.

## Typed sactions

The component builder should understand view actions:

```ts
row.button({
    action: "next",
    label: "Next",
});
```

The `action` property should only accept keys from the view's `actions` object.

This type should fail at compile time:

```ts
row.button({
    action: "nxt",
    label: "Next",
})
```

## Sessions Ownership

Every active view should have an owner policy:

```ts
await ctx.openView(view {
    access: "invoker",
});
```

Please add other access modes based on what is logical.

When an unauthorised user presses a button, Voxa should send an ephermeral response such as:

```markdown
This control belongs to another user.
```

## View lifetime

A view needs explicit expiry behavior:

```ts
await ctx.openView({
    timeout: 300_000,
    onTimeout: "disable",
});
```

Resonable policies:

```markdown
"disable"
"remove"
"keep"
```

The default should probably be `"disable"`

## Storgae architecture

Do not tightly couple view state to in-memory collectors.

Instead, define a small session-store interface.

That covers normal single-process bots.

Applications running multiple bot processes could later provide Redis or database-backed stores. Voxa itself should not depend on Redis.

The view definition should not be serialized. Store only:

* Session ID
* View identifier
* Current state
* Message and channel identifier
* Owner policy data
* Expiry timestamp

Views should be registered by stable name.

The runtime uses the name to find the view definition after loading a stored session.

## Reusable views

Views should not restricted to one command.

However, I would avoid making `openView()` wait until completion in the intial design:

```ts
const confirmed = await ctx.confirm(...);
```

That requires long-lived promises and process-local continuations. They do not survive restarts and complicate persistence.

Prefer action-oriented views:

```ts
await ctx.openView(deleteConfirmationView, {
    state: {
        roleId,
    },
});
```

The confirmation action performs the deletion itself.

Convenience APIs such as `ctx.confirm()` could be added later for simple in-memory usage.

## Clean module structure

This feature should be isolated from the command manager.

The command manager should not become responsible for view state. A higher-level interaction manager or facade can delegate between commands and views.

But I would not introduce a top-level Voxa class merely for aesthetics. Add it only when multiple subsystems genuinely need one shared entry point.

## Version-one scope

A clean first release should support only:

* Buttons
* String select menus
* In-memory sessions
* Typed state
* Typed action names
* Access control
* Idle timeout
* Automatic message updates
* Automatic component disabling on expiring
* One unified interaction handler

Defer:

* Modal forms
* Persistent stores
* Cross-process locking
* Nested views
* View history
* Browser-style navigation
* Awaitable confirmations
* Arbitrary serializable access predicates
* Automatic database persistence