/**
 * Preloaded Cruising Boat Checklist Data
 */
const CRUISING_BOAT_CHECKLIST = {
  id: 'cruising-boat-default',
  title: 'Cruising Boat Checklist',
  versionNumber: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString(),
  sublists: [
    {
      id: 'sub-1',
      name: 'Engine & Mechanical Check',
      items: [
        {
          id: 'item-1-1',
          name: 'Engine Oil & Coolant',
          description: 'Check dipstick and coolant expansion tank levels.',
          checked: false
        },
        {
          id: 'item-1-2',
          name: 'Fuel Level & Filters',
          description: 'Verify adequate fuel, check the primary fuel filter/water separator for water or sediment, and open the fuel shut-off valve.',
          checked: false
        },
        {
          id: 'item-1-3',
          name: 'Belts & Hoses',
          description: 'Inspect alternator/water pump belts for tension/wear and check engine hoses for leaks or corrosion.',
          checked: false
        },
        {
          id: 'item-1-4',
          name: 'Raw Water Intake',
          description: 'Ensure the raw water sea strainer is clear and the seacock (thru-hull valve) is fully open.',
          checked: false
        },
        {
          id: 'item-1-5',
          name: 'Engine Test',
          description: 'Start the engine, verify cooling water is discharging from the exhaust, and test forward/reverse gears while tied to the dock.',
          checked: false
        }
      ]
    },
    {
      id: 'sub-2',
      name: 'Rigging, Deck & Sails',
      items: [
        {
          id: 'item-2-1',
          name: 'Standing Rigging',
          description: 'Inspect stay pins, turnbuckles, and split pins for wear, cracks, or looseness.',
          checked: false
        },
        {
          id: 'item-2-2',
          name: 'Running Rigging',
          description: 'Check halyards, sheets, reefing lines, and control lines for chafing or fraying.',
          checked: false
        },
        {
          id: 'item-2-3',
          name: 'Sails',
          description: 'Uncover mainsail, inspect for tears or damaged stitching, and check that roller furling lines run freely.',
          checked: false
        },
        {
          id: 'item-2-4',
          name: 'Winches & Hardware',
          description: 'Ensure winch handles are onboard and secure; check blocks, tracks, and deck fittings.',
          checked: false
        },
        {
          id: 'item-2-5',
          name: 'Deck Clear & Secure',
          description: 'Stow all loose gear, secure hatches/hatches boards, and ensure lifelines and stanchions are firm.',
          checked: false
        }
      ]
    },
    {
      id: 'sub-3',
      name: 'Hull, Bilge & Thru-Hulls',
      items: [
        {
          id: 'item-3-1',
          name: 'Bilges',
          description: 'Inspect the bilge for water or oil accumulation; test automatic and manual bilge pumps.',
          checked: false
        },
        {
          id: 'item-3-2',
          name: 'Seacocks',
          description: 'Exercise all thru-hull valves (open/close) and verify emergency wooden bungs/plugs are tethered to each valve.',
          checked: false
        },
        {
          id: 'item-3-3',
          name: 'Steering System',
          description: 'Test the wheel/tiller for full range of movement and ensure the emergency tiller is easily accessible.',
          checked: false
        }
      ]
    },
    {
      id: 'sub-4',
      name: 'Electronics, Navigation & Power',
      items: [
        {
          id: 'item-4-1',
          name: 'Battery Power',
          description: 'Check battery voltage levels on the house and engine start banks.',
          checked: false
        },
        {
          id: 'item-4-2',
          name: 'Navigation Lights',
          description: 'Test bow running lights, stern light, steaming light, and anchor light.',
          checked: false
        },
        {
          id: 'item-4-3',
          name: 'Electronics & Radar/AIS',
          description: 'Power up chartplotter, depth sounder, wind instruments, and GPS; verify position and signal.',
          checked: false
        },
        {
          id: 'item-4-4',
          name: 'VHF Radio',
          description: 'Perform a radio check on VHF Channel 16 / local working channel to ensure proper transmit and receive capabilities.',
          checked: false
        }
      ]
    },
    {
      id: 'sub-5',
      name: 'Safety Gear & Crew Briefing',
      items: [
        {
          id: 'item-5-1',
          name: 'PFDs & Harnesses',
          description: 'Ensure fits are adjusted for all crew members; wear or stow personal flotation devices in an easily accessible location.',
          checked: false
        },
        {
          id: 'item-5-2',
          name: 'Fire Extinguishers & Flare Kit',
          description: 'Verify fire extinguishers are in the green zone and flares/distress signals are unexpired.',
          checked: false
        },
        {
          id: 'item-5-3',
          name: 'Throwable Devices & MOB Gear',
          description: 'Ensure Horseshoe buoys, LifeSlings, or throwable cushions are mounted and ready for quick deployment.',
          checked: false
        },
        {
          id: 'item-5-4',
          name: 'First Aid Kit',
          description: 'Confirm fully stocked and accessible location.',
          checked: false
        },
        {
          id: 'item-5-5',
          name: 'Safety Briefing',
          description: 'Brief crew/passengers on MOB (Man Overboard) procedure, location of safety gear, emergency bilge pump operation, VHF operation, and safe handholds/footing on deck.',
          checked: false
        }
      ]
    },
    {
      id: 'sub-6',
      name: 'Weather & Navigation Planning',
      items: [
        {
          id: 'item-6-1',
          name: 'Weather Forecast',
          description: 'Check current marine weather, radar, tide tables, and current predictions for your route.',
          checked: false
        },
        {
          id: 'item-6-2',
          name: 'Passage Plan',
          description: 'File a float plan with a family member or friend onshore detailing your route, estimated return time, and crew details.',
          checked: false
        },
        {
          id: 'item-6-3',
          name: 'Charts',
          description: 'Confirm updated paper or electronic charts are ready and route waypoints are programmed.',
          checked: false
        }
      ]
    },
    {
      id: 'sub-7',
      name: 'Final Departure Steps',
      items: [
        {
          id: 'item-7-1',
          name: 'Shore Power',
          description: 'Disconnect shore power cable and stow safely.',
          checked: false
        },
        {
          id: 'item-7-2',
          name: 'Fenders & Docklines',
          description: 'Assign crew roles for releasing docklines and stowing fenders once clear of the slip/marina.',
          checked: false
        }
      ]
    }
  ]
};
