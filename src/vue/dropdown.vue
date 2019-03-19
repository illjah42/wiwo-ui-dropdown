<template>
    <div class="ui-dropdown">
        <button aria-haspopup="true"
            class="ui-dropdown__toggler"
            @click.stop="toggleMenu"
            @keydown.esc="closeMenu"
        >
            <slot name="toggler">{{ name }}</slot>
        </button>
        <transition name="ui-dropdown-scale">
            <slot>
                <ul v-if="links && isOpened"
                    class="ui-dropdown__list"
                    :aria-expanded=" isOpened ? 'true' : 'false'">
                    <li v-for="(link, i) in links" :key="i">
                        <nuxt-link
                            :to="link.url"
                            class="ui-dropdown__list-item"
                        >
                            {{ link.name }}
                        </nuxt-link>
                    </li>
                </ul>
            </slot>
        </transition>
    </div>
</template>


<script>
const BOUNDARY_ELEMENT_DEFAULT = 'body'
const DEBOUNCE_TIMEOUT = 300

export default {

    name: 'ui-dropdown',

    props: {

        name: String,

        links: Array,

        right: {
            type: Boolean,
            default: false
        },

        top: {
            type: Boolean,
            default: false
        },

        autoPosition: {
            type: Boolean,
            default: true
        },

        boundary: {
            type: String,
            default: BOUNDARY_ELEMENT_DEFAULT
        }
    },


    data() {
        return {
            isOpened: false,
            boundaryElement: null,
            clipRect: {
                bounds: null,
                toggler: null,
                dropdown: null,
            },
            canOpen: {
                left: true,
                top: true,
                right: true,
                bottom: true
            },
            debounce: {
                scroll: null,
                resize: null
            }
        }
    },


    computed: {

        isTouch() {
            return this._isMounted && ( 'ontouchstart' in window || navigator.msMaxTouchPoints > 0 )
        },

        otsideClickEvents() {
            return this.isTouch ? ['touchstart', 'click'] : ['click']
        },

        positionEvents() {
            return this.autoPosition ?
                   [
                       { event: 'scroll', handler: 'scrollHandler'},
                       { event: 'resize', handler: 'resizeHandler'}
                   ] :
                   false
        },

        position: {

            get() {
                if ( ! this.autoPosition ) {
                    return {
                        right: this.right,
                        top: this.top
                    }
                }
                return {
                    right: (this.right && this.canOpen.right) || (this.canOpen.right && ! this.canOpen.left),
                    top: (this.top && this.canOpen.top) || (this.canOpen.top && ! this.canOpen.bottom)
                }
            },

            set( pos ) {
                for ( let direction in pos ) {
                    this.$set( this.canOpen, direction, pos[direction] )
                }
            }
        }
    },


    watch: {

        isOpened(isOpened) {
            if (isOpened) {
                this.otsideClickEvents.forEach( event => {
                    window.addEventListener(event, this.clikcOutsideHandler, {
                        capture: true
                    })
                })
                if ( this.positionEvents ) {
                    this.positionEvents.forEach( item => {
                        window.addEventListener(item.event, this[item.handler], {
                            passive: true
                        })
                    })
                }
            } else {
                this.otsideClickEvents.forEach( event => {
                    window.removeEventListener(event, this.clikcOutsideHandler)
                })
                if ( this.positionEvents ) {
                    this.positionEvents.forEach( item => {
                        window.removeEventListener(item.event, this[item.handler], {
                            passive: true
                        })
                    })
                }
            }
        }
    },


    methods: {

        toggleMenu() {
            this.isOpened = !this.isOpened
        },

        openMenu() {
            this.isOpened = true
        },

        closeMenu() {
            this.isOpened = false
        },

        clikcOutsideHandler($event) {
            if ( ! ( this.$el.contains($event.target) || this.$el === $event.target ) ||
                 this.$refs.overlay && ($event.target === this.$refs.overlay) ) {
                this.closeMenu();
            }
        },

        menuClickHandler($event) {
            if (['BUTTON', 'A'].includes($event.target.tagName) ||
                $event.target.closest('button, a')) {
                this.closeMenu();
            }
        },

        setBoundaryElement() {
            let boundaryElement = this.$el.closest(this.boundary)
            if ( ! boundaryElement ) boundaryElement = document.querySelector(BOUNDARY_ELEMENT_DEFAULT)
            this.boundaryElement = boundaryElement
        },

        setBoundingRect() {
            this.clipRect.bounds = this.boundaryElement.getBoundingClientRect()
        },

        setSelfBounds() {
            this.clipRect.toggler = this.$el.getBoundingClientRect()
        },

        setDropdownBounds() {
            this.clipRect.dropdown = {
                width: this.$refs.dropdown.clientWidth,
                height: this.$refs.dropdown.clientHeight
            }
        },

        checkPosition() {
            this.setBoundingRect()
            this.setSelfBounds()
            this.setDropdownBounds()
            if ( this.autoPosition ) {
                this.checkCanOpenHorizontal()
                this.checkCanOpenVertical()
            }
        },

        checkCanOpenHorizontal() {
            const bound = this.clipRect.bounds
            const el = this.clipRect.toggler
            const dropdown = this.clipRect.dropdown
            this.position = {
                left: bound.width + bound.left > el.left + dropdown.width,
                right: el.left - bound.left > dropdown.width - el.width
            }
        },

        checkCanOpenVertical() {
            const bound = this.clipRect.bounds
            const el = this.clipRect.toggler
            const dropdown = this.clipRect.dropdown
            const boundsPosition = {
                top: el.top - bound.top > dropdown.height,
                bottom: bound.top + bound.height - el.top - el.height > dropdown.height
            }
            const viewportPosition = {
                top: el.top > dropdown.height,
                bottom: el.top + el.height + dropdown.height < window.innerHeight
            }
            this.position = {
                top: boundsPosition.top && viewportPosition.top,
                bottom: boundsPosition.bottom && viewportPosition.bottom
            }
        },

        scrollHandler() {
            clearTimeout( this.debounce.scroll )
            this.debounce.scroll = setTimeout( () => {
                if ( this.isOpened ) {
                    this.setSelfBounds()
                    this.checkCanOpenHorizontal()
                    this.checkCanOpenVertical()
                }
            }, DEBOUNCE_TIMEOUT )
        },

        resizeHandler() {
            clearTimeout( this.debounce.resize )
            this.debounce.resize = setTimeout( () => {
                if ( this.isOpened ) {
                    this.checkPosition()
                }
            }, DEBOUNCE_TIMEOUT )
        }
    },

    mounted() {
        this.setBoundaryElement()
    }
}
</script>


<style lang="sass">
@import '../sass/variables.sass';

.ui-dropdown
    position: relative

    // &__toggler


    &__list
        background: var(--background, $background)
        color: var(--text-color, $text-color)
        box-shadow: 0 0 $gap var(--box-shadow, $box-shadow)

        padding: .75 * $gap
        margin: 0
        margin-top: .25 * $gap
        list-style: none
        min-width: 160px
        min-width: max-content

        position: absolute
        top: 100%
        left: 0
        z-index: 100

    &__list-item
        text-decoration: none

// transition
.ui-dropdown-scale

    &-enter,
    &-leave-to
        transform: scaleY(.85)
        opacity: 0

    &-enter-active,
    &-leave-active
        transform-origin: top center
        transition: transform $transition, opacity $transition
</style>
