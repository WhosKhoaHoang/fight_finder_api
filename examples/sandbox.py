import requests


if __name__ == "__main__":
    print("***** MAKE SURE THE SERVER IS RUNNING! *****")
    fighter = input("Fighter: ").replace(" ", "_").lower()
    fdata = requests.get("http://localhost:3000/data/{}".format(fighter)).json()

    #TODO: Figure out how to implement the "best opponent they ever beat" metric
    # - Looks at the W/L record of all the opponenets
    # - Choose the opponent with the best win percentage
    # - Need to consider how to define "best". E.g., a fighter could have a high
    #   win percentage, but they might have just had 1 fight. Also, you need
    #   to consider the qualitiy of fighters that the opponents beat...
    # - Consider how to handle case where there are no results. Should handle that
    #   case in the API itself. NOTE: All field values in the JSON are empty
    #   in case of no results.

    #OBSERVATIONS:
    # - Multiple calls to the API can slow down the execution time
    # - A possible app could be some sort of record report generator...

    for fight in fdata["fightHistory"]:
        opp_name = fight["opponent"].replace(" ", "_").lower()
        opp_data = requests.get("http://localhost:3000/data/{}".format(opp_name)).json()
        win_pct = round(opp_data["wins"]/(opp_data["wins"]+opp_data["losses"]+\
                            opp_data["ncs"]+opp_data["draws"]), 2)

        print("\n")
        print("Opponent: {}".format(fight["opponent"]))
        print("Opponent victory percentage: {}".format(win_pct))
        print("\n")
